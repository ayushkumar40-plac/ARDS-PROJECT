/* ==========================================================================
 * ARDS — AI Insights Module (additive feature; does not modify existing logic)
 * --------------------------------------------------------------------------
 * Ingests telemetry from the ESP32 gait node (HX711 load cell + MPU6050):
 *   D,<ms>,<kg>,<ax>,<ay>,<az>,<gx>,<gy>,<gz>,<state>   raw sample (state 1=stance)
 *   E,<ms>,<steps>,<cadence>,<speed>,<dist>,<stride>,<MODE>  heel-strike event
 *   S,<ms>,<steps>,<cadence>,<speed>,<dist>,<stancePct>      1 Hz status
 * Sources: Web-Bluetooth (BLE Nordic UART), telemetry file / CSV, paste,
 *          or a built-in demo generator.
 * Pipeline: parse -> features -> anomaly detection -> risk score -> forecast
 *           -> rule-based insights -> (optional) LLM narrative.
 * ========================================================================== */
(function () {
  'use strict';

  /* ============================ AI CORE (pure) ============================
   * DOM-free so it can be unit-tested in Node and reused by other modules. */
  const ARDSAICore = {

    /* --- small math helpers ------------------------------------------- */
    mean(a) { return a.length ? a.reduce((s, v) => s + v, 0) / a.length : 0; },
    std(a) {
      if (a.length < 2) return 0;
      const m = this.mean(a);
      return Math.sqrt(a.reduce((s, v) => s + (v - m) * (v - m), 0) / (a.length - 1));
    },
    median(a) {
      if (!a.length) return 0;
      const s = [...a].sort((x, y) => x - y), mid = s.length >> 1;
      return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
    },
    clamp(v, lo, hi) { return Math.min(hi, Math.max(lo, v)); },
    linreg(xs, ys) {
      const n = Math.min(xs.length, ys.length);
      if (n < 2) return { slope: 0, intercept: n ? ys[0] : 0 };
      const mx = this.mean(xs), my = this.mean(ys);
      let num = 0, den = 0;
      for (let i = 0; i < n; i++) { const dx = xs[i] - mx, dy = ys[i] - my; num += dx * dy; den += dx * dx; }
      const slope = den ? num / den : 0;
      return { slope, intercept: my - slope * mx };
    },

    /* --- telemetry parser ----------------------------------------------
     * Accepts the device's raw line protocol AND the CSV written by
     * firmware/pc_logger/gait_logger.py (auto-detected via header). */
    parseTelemetry(text) {
      const out = { events: [], status: [], raw: [], banners: [], skipped: 0 };
      if (!text || typeof text !== 'string') return out;
      const lines = text.split(/\r?\n/);
      let csvHeader = null;                       // CSV column-name -> index map

      for (let ln = 0; ln < lines.length; ln++) {
        const line = lines[ln].trim();
        if (!line) continue;

        /* CSV mode: header row from gait_logger export */
        if (!csvHeader && /^type\s*,/.test(line)) {
          csvHeader = {};
          line.split(',').forEach((name, i) => { csvHeader[name.trim()] = i; });
          continue;
        }
        if (csvHeader) {
          const c = line.split(',');
          const g = (name) => { const i = csvHeader[name]; return i != null ? parseFloat(c[i]) : NaN; };
          const type = (c[csvHeader.type] || '').trim().toUpperCase();
          if (type === 'E') {
            out.events.push({ t: g('t_ms'), steps: g('steps'), cadence: g('cadence_spm'),
                              speed: g('speed_mps'), dist: g('dist_m'),
                              stride: g('stride_m'), mode: (c[csvHeader.mode] || '').trim() });
          } else if (type === 'S') {
            out.status.push({ t: g('t_ms'), steps: g('steps'), cadence: g('cadence_spm'),
                              speed: g('speed_mps'), dist: g('dist_m'), stancePct: g('stance_pct') });
          } else if (type === 'D') {
            out.raw.push({ t: g('t_ms'), kg: g('kg'), state: g('state') });
          } else { out.skipped++; }
          continue;
        }

        /* device line protocol */
        if (line.charAt(0) === '[') { out.banners.push(line); continue; }
        const p = line.split(',').map((s) => s.trim());
        try {
          if (p[0] === 'D' && p.length >= 10) {
            out.raw.push({ t: +p[1], kg: +p[2], ax: +p[3], ay: +p[4], az: +p[5],
                           gx: +p[6], gy: +p[7], gz: +p[8], state: +p[9] });
          } else if (p[0] === 'E' && p.length >= 8) {
            out.events.push({ t: +p[1], steps: +p[2], cadence: +p[3], speed: +p[4],
                              dist: +p[5], stride: +p[6], mode: p[7] });
          } else if (p[0] === 'S' && p.length >= 7) {
            out.status.push({ t: +p[1], steps: +p[2], cadence: +p[3], speed: +p[4],
                              dist: +p[5], stancePct: +p[6] });
          } else { out.skipped++; }
        } catch (e) { out.skipped++; }
      }
      /* keep only finite numeric records */
      const ok = (r, keys) => keys.every((k) => Number.isFinite(r[k]));
      out.events = out.events.filter((r) => ok(r, ['t', 'cadence', 'speed']));
      out.status = out.status.filter((r) => ok(r, ['t', 'stancePct']));
      out.raw = out.raw.filter((r) => ok(r, ['t', 'kg']));
      return out;
    },

    /* --- live state ------------------------------------------------------- */
    telemetry: { raw: [], events: [], status: [], sources: [] },
    lastAutoRender: 0,

    /* --- single-line ingest for live BT/serial streams -------------------- */
    parseLine(line) {
      if (!line || typeof line !== 'string') return false;
      const res = this.parseTelemetry(line);
      const n = res.events.length + res.status.length + res.raw.length;
      if (!n) return false;
      this.telemetry.events.push(...res.events);
      this.telemetry.status.push(...res.status);
      this.telemetry.raw.push(...res.raw);
      /* bounded buffer so long sessions cannot exhaust memory */
      if (this.telemetry.raw.length > 20000) {
        this.telemetry.raw.splice(0, this.telemetry.raw.length - 20000);
      }
      return true;
    },

    /* --- bulk ingest from paste / file / demo ------------------------------ */
    ingestText(text, sourceLabel) {
      const res = this.parseTelemetry(text);
      if (sourceLabel) this.telemetry.sources.push(sourceLabel);
      this.telemetry.events.push(...res.events);
      this.telemetry.status.push(...res.status);
      this.telemetry.raw.push(...res.raw);
      return res.events.length + res.status.length + res.raw.length;
    },

    /* --- feature extraction --------------------------------------------- */
    extractFeatures(t) {
      const f = {
        steps: 0, durationS: 0, distanceM: 0, mode: '',
        cadenceMean: 0, cadenceCV: 0, cadenceTrendPct: 0,
        speedMean: 0, speedMax: 0, speedTrendPct: 0,
        stancePct: 0, stepTimeCV: 0, peakKg: 0, loadMedianKg: 0, loadCV: 0,
        valid: false, eventCount: t.events.length, statusCount: t.status.length,
        rawCount: t.raw.length
      };
      const evs = [...t.events].sort((a, b) => a.t - b.t);
      const sts = [...t.status].sort((a, b) => a.t - b.t);

      if (evs.length) {
        const last = evs[evs.length - 1];
        f.steps = last.steps || evs.length;
        f.distanceM = last.dist || 0;
        f.mode = last.mode || '';
        f.durationS = (last.t - evs[0].t) / 1000;
        const cad = evs.map((e) => e.cadence).filter((v) => v > 0);
        const spd = evs.map((e) => e.speed).filter((v) => v > 0);
        f.cadenceMean = this.mean(cad);
        f.cadenceCV = cad.length > 1 && f.cadenceMean ? (this.std(cad) / f.cadenceMean) * 100 : 0;
        f.speedMean = this.mean(spd);
        f.speedMax = spd.length ? Math.max(...spd) : 0;
        /* trend: regression of speed / cadence against step index */
        if (spd.length >= 4) {
          const xs = spd.map((_, i) => i);
          const rS = this.linreg(xs, spd);
          const rC = this.linreg(xs, cad);
          f.speedTrendPct = f.speedMean ? (rS.slope * (spd.length - 1) / f.speedMean) * 100 : 0;
          f.cadenceTrendPct = f.cadenceMean ? (rC.slope * (cad.length - 1) / f.cadenceMean) * 100 : 0;
        }
        /* step-time regularity from heel-strike intervals */
        const dts = [];
        for (let i = 1; i < evs.length; i++) {
          const dt = evs[i].t - evs[i - 1].t;
          if (dt >= 250 && dt <= 5000) dts.push(dt);
        }
        const dtMean = this.mean(dts);
        f.stepTimeCV = dts.length > 1 && dtMean ? (this.std(dts) / dtMean) * 100 : 0;
        f.valid = f.steps >= 3 && spd.length >= 3;
      }
      if (sts.length) {
        const last = sts[sts.length - 1];
        if (!f.steps) f.steps = last.steps || 0;
        if (!f.distanceM) f.distanceM = last.dist || 0;
        if (!f.durationS) f.durationS = (last.t - sts[0].t) / 1000;
        f.stancePct = this.mean(sts.map((s) => s.stancePct));
      }
      const stanceLoads = t.raw.filter((r) => r.state === 1 && r.kg > 0).map((r) => r.kg);
      if (stanceLoads.length) {
        f.peakKg = Math.max(...stanceLoads);
        f.loadMedianKg = this.median(stanceLoads);
        const lm = this.mean(stanceLoads);
        f.loadCV = lm ? this.std(stanceLoads) / lm : 0;
      }
      return f;
    },

    /* --- anomaly detection (rule + dispersion based) --------------------- */
    detectAnomalies(f) {
      const A = [];
      if (!f.valid) {
        A.push({ severity: 'info', icon: 'info', title: 'Insufficient gait data',
                 text: 'Fewer than 3 valid steps were captured. Walk for at least 20–30 seconds so the AI model can evaluate rhythm, speed and loading.' });
        return A;
      }
      if (f.speedTrendPct <= -15) {
        A.push({ severity: 'critical', icon: 'trending-down', title: 'Marked gait-speed decline',
                 text: `Speed fell ${Math.abs(f.speedTrendPct).toFixed(1)}% across the session (${f.speedMean.toFixed(2)} m/s mean). This pattern suggests emerging fatigue — consider shortening the next bout or adding a seated rest break.` });
      } else if (f.speedTrendPct <= -8) {
        A.push({ severity: 'warning', icon: 'trending-down', title: 'Gait speed declining',
                 text: `Speed drifted down ${Math.abs(f.speedTrendPct).toFixed(1)}% over the session while cadence held ${f.cadenceMean.toFixed(0)} spm. Early-stage fatigue signature; monitor stride length on the next set.` });
      }
      if (f.cadenceTrendPct <= -8) {
        A.push({ severity: 'warning', icon: 'activity', title: 'Cadence dropping',
                 text: `Step rate decreased ${Math.abs(f.cadenceTrendPct).toFixed(1)}% from start to end of the captured window.` });
      }
      if (f.stepTimeCV > 8) {
        A.push({ severity: 'warning', icon: 'shuffle', title: 'Irregular step rhythm',
                 text: `Step-time variability is ${f.stepTimeCV.toFixed(1)}% (comfortable walking is typically < 6%). Irregular timing can indicate balance compensation or inconsistent socket comfort.` });
      }
      if (f.stancePct && f.stancePct < 55) {
        A.push({ severity: 'warning', icon: 'footprints', title: 'Shortened stance phase',
                 text: `Stance occupied only ${f.stancePct.toFixed(1)}% of the gait cycle (typical single-foot reference ≈ 60%). Weight may be shifted to the contralateral limb; check load tolerance and pain reports.` });
      } else if (f.stancePct && f.stancePct > 68) {
        A.push({ severity: 'info', icon: 'footprints', title: 'Prolonged stance phase',
                 text: `Stance measured ${f.stancePct.toFixed(1)}% of the cycle — unusually long; verify swing clearance is not being reduced.` });
      }
      if (f.loadCV > 0.35 && f.rawCount > 20) {
        A.push({ severity: 'warning', icon: 'gauge', title: 'Erratic vertical loading',
                 text: `Load-cell variability during stance is high (CV ${(f.loadCV * 100).toFixed(0)}%). Check sensor seating and weight-shift smoothness.` });
      }
      if (f.cadenceMean && f.cadenceMean < 60) {
        A.push({ severity: 'info', icon: 'gauge', title: 'Low cadence',
                 text: `Average cadence ${f.cadenceMean.toFixed(0)} spm is below the ~90–120 spm comfortable band for adults.` });
      } else if (f.cadenceMean > 130) {
        A.push({ severity: 'info', icon: 'gauge', title: 'High cadence',
                 text: `Average cadence ${f.cadenceMean.toFixed(0)} spm — verify step-detection thresholds if this was a relaxed walk.` });
      }
      if (!A.length) {
        A.push({ severity: 'ok', icon: 'check-circle-2', title: 'No anomalies detected',
                 text: 'Speed trend, cadence stability, step-time regularity and stance ratio are all within expected bands for this capture.' });
      }
      return A;
    },

    /* --- composite risk score (0 = excellent, 100 = high risk) ---------- */
    riskScore(f) {
      if (!f.valid) return { total: 0, band: 'NO DATA', color: 'slate', parts: null };
      const rhythm = this.clamp(f.stepTimeCV * 8, 0, 100);
      const speed  = this.clamp(-f.speedTrendPct * 4, 0, 100);
      const load   = this.clamp((f.loadCV - 0.15) * 400, 0, 100);
      const stance = f.stancePct ? this.clamp(Math.abs(f.stancePct - 60) * 8, 0, 100) : 0;
      const total  = Math.round(0.30 * rhythm + 0.30 * speed + 0.20 * load + 0.20 * stance);
      const band = total < 30 ? 'LOW' : (total < 60 ? 'MODERATE' : 'HIGH');
      const color = total < 30 ? 'emerald' : (total < 60 ? 'amber' : 'rose');
      return { total, band, color, parts: { rhythm, speed, load, stance } };
    },

    /* --- short-horizon forecast (linear regression) ---------------------- */
    forecast(f) {
      if (!f.valid || f.speedMean <= 0) {
        return { nextSpeed: 0, deltaPct: 0, text: 'Not enough data to forecast.' };
      }
      const slopePerStep = (f.speedTrendPct / 100) * f.speedMean / Math.max(1, f.eventCount - 1);
      const nextSpeed = this.clamp(f.speedMean + slopePerStep * 10, 0, 5);
      const deltaPct = f.speedMean ? ((nextSpeed - f.speedMean) / f.speedMean) * 100 : 0;
      let text;
      if (deltaPct <= -5)      text = `Model projects speed ≈ ${nextSpeed.toFixed(2)} m/s (${deltaPct.toFixed(1)}%) if the current fatigue trend continues — plan a rest interval.`;
      else if (deltaPct >= 5)  text = `Model projects speed ≈ ${nextSpeed.toFixed(2)} m/s (+${deltaPct.toFixed(1)}%) — the patient is still ramping up; continue the current protocol.`;
      else                     text = `Model projects speed ≈ ${nextSpeed.toFixed(2)} m/s (±${Math.abs(deltaPct).toFixed(1)}%) — performance is steady at this intensity.`;
      return { nextSpeed, deltaPct, text };
    },

    /* --- rule-based natural-language insights ---------------------------- */
    insights(f, anomalies, risk, fc) {
      const I = [];
      if (!f.valid) return anomalies.slice(0, 3);
      I.push({ severity: 'info', icon: 'ruler', title: 'Session summary',
               text: `${f.steps} steps over ${f.durationS.toFixed(0)} s · mean speed ${f.speedMean.toFixed(2)} m/s (max ${f.speedMax.toFixed(2)}) · cadence ${f.cadenceMean.toFixed(0)} spm · distance ${f.distanceM.toFixed(1)} m${f.peakKg ? ` · peak load ${f.peakKg.toFixed(1)} kg` : ''}${f.mode ? ` · mode ${f.mode}` : ''}.` });
      if (f.stancePct) {
        const sTxt = f.stancePct >= 55 && f.stancePct <= 68
          ? 'within the expected 55–68% single-foot window'
          : 'outside the expected 55–68% single-foot window';
        I.push({ severity: (f.stancePct < 55 || f.stancePct > 68) ? 'warning' : 'ok', icon: 'footprints',
                 title: 'Stance-phase ratio',
                 text: `Stance occupied ${f.stancePct.toFixed(1)}% of the cycle — ${sTxt}.` });
      }
      if (f.stepTimeCV) {
        I.push({ severity: f.stepTimeCV > 8 ? 'warning' : 'ok', icon: 'waves',
                 title: 'Step-time regularity',
                 text: `Step-to-step timing variability ${f.stepTimeCV.toFixed(1)}% ${f.stepTimeCV > 8 ? '(irregular — review balance support and socket fit)' : '(regular rhythm)'}.` });
      }
      const bad = anomalies.filter((a) => a.severity === 'warning' || a.severity === 'critical');
      if (bad.length) {
        I.push({ severity: bad[0].severity, icon: bad[0].icon, title: bad[0].title, text: bad[0].text });
      }
      I.push({ severity: fc.deltaPct <= -5 ? 'warning' : 'info', icon: 'line-chart',
               title: 'Short-horizon forecast', text: fc.text });
      if (risk.parts) {
        const rec = risk.band === 'HIGH'
          ? 'Recommendation: pause progression, review pain/socket comfort, and re-assess with assisted walking before the next loaded set.'
          : (risk.band === 'MODERATE'
            ? 'Recommendation: hold the current difficulty for one more session; focus on cadence consistency before adding load.'
            : 'Recommendation: metrics support maintaining or gently progressing the current protocol (≤ +10% load per week).');
        I.push({ severity: risk.band === 'HIGH' ? 'critical' : (risk.band === 'MODERATE' ? 'warning' : 'ok'),
                 icon: 'shield-check', title: `Composite gait risk: ${risk.band} (${risk.total}/100)`, text: rec });
      }
      return I;
    },

    /* --- demo capture (clearly-labelled synthetic data) ------------------- */
    demoText() {
      const L = [];
      let t = 1000, steps = 0, dist = 0;
      const stride = 0.413 * 1.70;
      let speed = 0.98, cad = 106;
      for (let s = 1; s <= 28; s++) {
        const dt = 60000 / cad;
        t += dt;
        steps++;
        dist += stride;
        speed = Math.max(0.72, speed - 0.009 + (Math.sin(s * 2.7) * 0.012));
        cad = Math.max(88, cad - 0.55 + Math.sin(s * 1.9) * 1.4);
        L.push(`E,${Math.round(t)},${steps},${cad.toFixed(1)},${speed.toFixed(2)},${dist.toFixed(2)},${stride.toFixed(3)},STRIDE`);
      }
      for (let k = 1; k <= 30; k++) {
        const st = Math.round((k * 1010) + (k % 7) * 9);
        const stance = 58 + Math.sin(k * 0.8) * 2.2;
        L.push(`S,${st},${Math.min(steps, Math.round(k * 0.95))},${(106 - k * 0.5).toFixed(1)},${(0.98 - k * 0.008).toFixed(2)},${(Math.min(steps, Math.round(k * 0.95)) * stride).toFixed(2)},${stance.toFixed(1)}`);
      }
      let rt = 1000;
      for (let i = 0; i < 60; i++) {
        rt += 500;
        const phase = (i % 6) < 4 ? 1 : 0;
        const kg = phase ? (28 + Math.sin(i * 0.9) * 6 + (i * 0.02)) : (0.3 + Math.abs(Math.sin(i)) * 0.2);
        L.push(`D,${rt},${kg.toFixed(2)},0.12,-0.05,${(phase ? 9.7 : 9.9).toFixed(2)},1.2,-0.8,0.4,${phase}`);
      }
      return L.join('\n') + '\n';
    },

  /* ---- analysis pipeline + UI rendering ---- */
  computeAll() {
    this.features = this.extractFeatures(this.telemetry);
    this.anomalies = this.detectAnomalies(this.features);
    this.risk = this.riskScore(this.features);
    this.forecastRes = this.forecast(this.features);
    this.insightCards = this.insights(this.features, this.anomalies, this.risk, this.forecastRes);
  },

  render(el) {
    if (!this.insightCards) this.computeAll();
    this.el = el;
    const t = this.telemetry;
    const f = this.features, anomalies = this.anomalies, risk = this.risk, fc = this.forecastRes;
    const sevLabel = { critical: 'Critical', warning: 'Warning', info: 'Info', ok: 'OK' };
    const card = (c) => `
      <div class="ards-ai-card sev-${c.severity}">
        <div class="ards-ai-card-head">
          <i data-lucide="${c.icon}" class="ards-ai-card-icon"></i>
          <span class="ards-ai-card-title">${c.title}</span>
          <span class="ards-ai-badge">${sevLabel[c.severity]}</span>
        </div>
        <p class="ards-ai-card-text">${c.text}</p>
      </div>`;
    const hasData = t.raw.length || t.events.length || t.status.length;
    const body = hasData ? `
      <div class="ards-ai-grid">
        <div class="stat-card"><div class="stat-card-label">Mean speed</div><div class="stat-card-value">${f.speedMean.toFixed(2)}<span class="stat-card-unit">m/s</span></div></div>
        <div class="stat-card"><div class="stat-card-label">Cadence</div><div class="stat-card-value">${f.cadenceMean.toFixed(0)}<span class="stat-card-unit">spm</span></div></div>
        <div class="stat-card"><div class="stat-card-label">Steps</div><div class="stat-card-value">${f.steps}</div></div>
        <div class="stat-card"><div class="stat-card-label">Stance ratio</div><div class="stat-card-value">${f.stancePct ? f.stancePct.toFixed(1) : '—'}<span class="stat-card-unit">%</span></div></div>
        <div class="stat-card"><div class="stat-card-label">Peak load</div><div class="stat-card-value">${f.peakKg ? f.peakKg.toFixed(1) : '—'}<span class="stat-card-unit">kg</span></div></div>
        <div class="stat-card"><div class="stat-card-label">Risk score</div><div class="stat-card-value">${risk.total}<span class="stat-card-unit">/100 ${risk.band}</span></div></div>
        <div class="stat-card"><div class="stat-card-label">Forecast · next 10 steps</div><div class="stat-card-value">${fc.nextSpeed ? fc.nextSpeed.toFixed(2) : '—'}<span class="stat-card-unit">m/s</span></div></div>
      </div>` : `
      <div class="ards-ai-empty">
        <i data-lucide="cpu" class="ards-ai-empty-icon"></i>
        <p class="ards-ai-empty-title">No gait telemetry analyzed yet</p>
        <p class="ards-ai-empty-text">Connect the ESP32-GAIT device on the <strong>Data Upload</strong> tab, or paste a serial capture
        (the <code>D,…</code> / <code>S,…</code> / <code>E,…</code> lines) below and press <strong>Analyze</strong>. You can also
        load a clearly-labelled synthetic demo to preview the model.</p>
        <textarea id="aiPasteBox" class="ards-ai-paste" rows="6" spellcheck="false"
          placeholder="D,1023,32.10,-0.21,0.13,9.71,1.10,-0.60,0.30,1&#10;S,2041,3,104.2,0.97,1.20,59.4&#10;E,3050,4,104.0,0.98,1.62,0.702,STRIDE"></textarea>
      </div>`;
    el.innerHTML = `
      <div class="ards-ai-header">
        <div class="ards-ai-header-text">
          <h3 class="ards-ai-title"><i data-lucide="sparkles" class="ards-ai-title-icon"></i>Gait AI Insights</h3>
          <p class="ards-ai-subtitle">On-device signal model — fatigue trend, rhythm regularity, loading quality and risk
            forecasting from HX711 pressure + MPU6050 telemetry.</p>
        </div>
        <div class="ards-ai-actions">
          <button type="button" id="btnAiConnect" class="ards-ai-btn ards-ai-btn-ghost" title="Stream live telemetry over USB (Web Serial)"><i data-lucide="usb"></i><span>USB</span></button>
          <button type="button" id="btnAiFile" class="ards-ai-btn ards-ai-btn-ghost" title="Load a CSV from gait_logger.py"><i data-lucide="file-up"></i><span>CSV</span></button>
          <input type="file" id="aiFileInput" accept=".csv,.txt,.log" class="hidden">
          <button type="button" id="btnAiAnalyze" class="ards-ai-btn ards-ai-btn-primary"><i data-lucide="activity"></i><span>Analyze</span></button>
          <button type="button" id="btnAiDemo" class="ards-ai-btn ards-ai-btn-ghost"><i data-lucide="flask-conical"></i><span>Demo</span></button>
        </div>
      </div>
      <div id="aiStatus" class="ards-ai-status" aria-live="polite"></div>
      ${body}
      <div class="ards-ai-columns">
        <div class="ards-ai-col">
          <h4 class="ards-ai-col-title"><i data-lucide="alert-triangle" class="ards-ai-col-icon"></i>Detected anomalies</h4>
          ${anomalies.map(card).join('')}
        </div>
        <div class="ards-ai-col">
          <h4 class="ards-ai-col-title"><i data-lucide="shield-check" class="ards-ai-col-icon"></i>Risk score breakdown</h4>
          ${risk.parts ? `
          <div class="ards-ai-risk-visual">
            <div class="ards-ai-ring risk-${risk.color}" style="--p:${Math.max(0, Math.min(100, risk.total))}"><span>${risk.total}</span></div>
            <div class="ards-ai-risk-parts">
              ${[['Rhythm', risk.parts.rhythm], ['Fatigue', risk.parts.speed], ['Loading', risk.parts.load], ['Stance', risk.parts.stance]].map(([n, v]) => `
              <div class="ards-ai-risk-part">
                <span class="ards-ai-risk-name">${n}</span>
                <div class="ards-ai-risk-bar"><div style="width:${Math.max(0, Math.min(100, Math.round(v)))}%"></div></div>
              </div>`).join('')}
            </div>
          </div>` : '<p class="ards-ai-note">Risk scoring starts once a valid capture (≥ 3 steps) has been analyzed.</p>'}
        </div>
        <div class="ards-ai-col ards-ai-col-wide">
          <h4 class="ards-ai-col-title"><i data-lucide="lightbulb" class="ards-ai-col-icon"></i>AI insights &amp; recommendations</h4>
          ${this.insightCards.map(card).join('')}
        </div>
      </div>
      <p class="ards-ai-disclaimer"><i data-lucide="info"></i>AI-generated gait analysis from on-device signal processing.
        Decision support only — not a medical diagnosis. Always validate against clinical observation.</p>`;
    const btnAnalyze = el.querySelector('#btnAiAnalyze');
    if (btnAnalyze) btnAnalyze.addEventListener('click', () => this.analyze('manual'));
    const btnDemo = el.querySelector('#btnAiDemo');
    if (btnDemo) btnDemo.addEventListener('click', () => this.loadDemo());
    const btnConnect = el.querySelector('#btnAiConnect');
    if (btnConnect) {
      if (navigator.serial) btnConnect.addEventListener('click', () => this.toggleSerial());
      else btnConnect.classList.add('hidden');
    }
    const btnFile = el.querySelector('#btnAiFile');
    const fileInput = el.querySelector('#aiFileInput');
    if (btnFile && fileInput) {
      btnFile.addEventListener('click', () => fileInput.click());
      fileInput.addEventListener('change', () => this.ingestFile(fileInput.files && fileInput.files[0]));
    }
    try {
      if (window.lucide && typeof window.lucide.createIcons === 'function') window.lucide.createIcons();
    } catch (e) { /* icons optional */ }
  },

  /* ---- lifecycle ---- */
  setStatus(msg, isError) {
    const st = document.getElementById('aiStatus');
    if (st) {
      st.textContent = msg || '';
      st.classList.toggle('ards-ai-status-err', !!isError);
    }
  },

  analyze(sourceLabel) {
    try {
      const box = document.getElementById('aiPasteBox');
      if (box && box.value.trim()) {
        const n = this.ingestText(box.value, sourceLabel || 'pasted capture');
        if (!n) { this.setStatus('No D:/S:/E: telemetry lines found in the pasted text.', true); return; }
      }
      this.computeAll();
      if (this.el) this.render(this.el);
      const f = this.features;
      if (f.valid) {
        this.setStatus(`Analysis complete — ${f.steps} steps · ${f.speedMean.toFixed(2)} m/s mean · risk ${this.risk.total}/100 (${this.risk.band}).`);
      } else {
        this.setStatus('Processed the available telemetry — not enough valid steps yet for full scoring.', f.eventCount > 0);
      }
    } catch (err) {
      this.setStatus('Analysis failed: ' + err.message, true);
    }
  },

  loadDemo() {
    const n = this.ingestText(this.demoText(), 'demo capture (synthetic)');
    this.computeAll();
    if (this.el) this.render(this.el);
    if (n) this.setStatus(`Synthetic demo capture loaded and analyzed (${this.features.steps} steps) — not real patient data.`);
  },

  /* --- USB live streaming (Web Serial; Chrome/Edge) ---------------------- */
  toggleSerial() {
    if (this.serialActive) {
      this.serialActive = false;
      this.setStatus('Disconnecting from serial stream…');
    } else {
      this.connectSerial();
    }
  },

  async connectSerial() {
    if (!navigator.serial) {
      this.setStatus('Web Serial is unavailable here — use Chrome/Edge over USB, or paste / CSV instead.', true);
      return;
    }
    try {
      const port = await navigator.serial.requestPort();
      await port.open({ baudRate: 115200 });
      this.serialActive = true;
      this.setStatus('ESP32 connected over USB — streaming gait telemetry…');
      const decoder = new TextDecoderStream();
      port.readable.pipeTo(decoder.writable).catch(() => {});
      const reader = decoder.readable.getReader();
      let buf = '';
      while (this.serialActive) {
        const chunk = await reader.read();
        if (chunk.done) break;
        buf += chunk.value;
        const lines = buf.split(/\r?\n/);
        buf = lines.pop() || '';
        for (const l of lines) {
          const t = l.trim();
          if (t) this.update(t);
        }
      }
      try { reader.cancel(); } catch (e) { /* stream already gone */ }
      try { await port.close(); } catch (e) { /* port already closed */ }
      if (!this.serialActive) this.setStatus('Serial stream ended — capture retained for analysis.');
    } catch (err) {
      this.serialActive = false;
      this.setStatus('Serial connection failed: ' + (err && err.message ? err.message : err), true);
    }
  },

  /* --- CSV / text file ingest (gait_logger.py output) --------------------- */
  ingestFile(file) {
    if (!file) return;
    const fr = new FileReader();
    fr.onload = () => {
      const n = this.ingestText(String(fr.result || ''), 'file: ' + file.name);
      this.computeAll();
      if (this.el) this.render(this.el);
      if (n) this.setStatus(`Loaded ${file.name} — ${n} telemetry rows analyzed.`);
      else this.setStatus('No D/S/E telemetry rows found in that file.', true);
    };
    fr.onerror = () => this.setStatus('Could not read that file.', true);
    fr.readAsText(file);
  },

  onShow() {
    const el = document.getElementById('section-aiinsights');
    if (!el) return;
    this.computeAll();
    this.render(el);
  },

  /* live hook: feed each serial/BT line; re-renders at most every 1.5 s */
  update(line) {
    if (!this.parseLine(line)) return;
    const now = Date.now();
    if (this.el && now - this.lastAutoRender > 1500) {
      this.lastAutoRender = now;
      this.computeAll();
      this.render(this.el);
    }
  },

  reset() {
    this.telemetry = { raw: [], events: [], status: [], sources: [] };
    this.features = this.anomalies = this.risk = this.forecastRes = this.insightCards = null;
    if (this.el) this.render(this.el);
  }
};

/* Global instance */
  window.ardsAI = ARDSAICore;

  /* Render the AI section whenever its tab is opened (UI-only wrapper; the
     original switchTab behaviour is fully preserved). */
  const prevSwitchTab = window.switchTab;
  window.switchTab = function (tabId) {
    if (prevSwitchTab) prevSwitchTab(tabId);
    if (tabId === 'aiinsights' && window.ardsAI) window.ardsAI.onShow();
  };
})();






