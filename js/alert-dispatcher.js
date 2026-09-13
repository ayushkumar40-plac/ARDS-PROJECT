/* ==========================================================================
 * ARDS — High-Risk Alert Dispatcher (js/alert-dispatcher.js)
 * --------------------------------------------------------------------------
 * Sends SMS + WhatsApp alerts via the /api/send-alert Vercel endpoint
 * whenever any risk engine in the dashboard detects a HIGH-risk condition.
 *
 * Usage:
 *   window.ardsAlert.dispatch({ riskBand, riskType, riskScore, detail, patientName })
 *
 * Contact numbers are read from localStorage (set via settings UI):
 *   ards_doctor_phone   — doctor / clinician E.164 number
 *   ards_patient_phone  — patient / emergency contact E.164 number
 * ========================================================================== */
(function () {
  'use strict';

  /* The API endpoint — works both on Vercel (production) and locally with
     `vercel dev`. Falls back gracefully in plain file:// previews. */
  const ALERT_API = '/api/send-alert';

  /**
   * Core dispatch function.
   * @param {object} opts
   * @param {string}  opts.riskBand      — Must be 'HIGH' to fire
   * @param {string}  opts.riskType      — Label, e.g. 'Gait AI' | 'Fall Instability'
   * @param {number}  [opts.riskScore]   — Numeric score (0-100)
   * @param {string}  [opts.detail]      — One-line human-readable reason
   * @param {string}  [opts.patientName] — Override patient display name
   * @returns {Promise<void>}
   */
  async function dispatch(opts = {}) {
    const { riskBand, riskType, riskScore, detail, patientName } = opts;

    // Only fire for HIGH risk
    if (riskBand !== 'HIGH') return;

    // Resolve phone numbers from localStorage
    const doctorPhone  = (localStorage.getItem('ards_doctor_phone')  || '').trim();
    const patientPhone = (localStorage.getItem('ards_patient_phone') || '').trim();

    if (!doctorPhone && !patientPhone) {
      console.warn('[ARDS Alert] No phone numbers configured. Set them in Settings → Alert Contacts.');
      if (typeof window.showArdsToast === 'function') {
        window.showArdsToast(
          '⚠️ HIGH risk detected — no alert contacts configured. Add numbers in Settings.',
          'warning'
        );
      }
      return;
    }

    // Resolve patient name (try logged-in user first)
    const resolvedName = patientName ||
      (() => {
        try {
          const u = JSON.parse(localStorage.getItem('ards_current_user') || 'null');
          return u && u.name ? u.name : null;
        } catch { return null; }
      })() || 'Unknown Patient';

    const payload = {
      patientName:  resolvedName,
      riskBand:     'HIGH',
      riskType:     riskType  || 'Unknown',
      riskScore:    riskScore != null ? riskScore : null,
      detail:       detail    || 'HIGH risk condition detected — immediate clinical review required.',
      doctorPhone:  doctorPhone  || null,
      patientPhone: patientPhone || null,
      timestamp:    new Date().toISOString(),
    };

    // Show in-app toast immediately so the user knows an alert is firing
    if (typeof window.showArdsToast === 'function') {
      window.showArdsToast(
        `🚨 HIGH RISK (${riskType || 'Gait'}) — Sending SMS & WhatsApp alert…`,
        'error'
      );
    }

    try {
      const res = await fetch(ALERT_API, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(payload),
      });
      const data = await res.json();

      if (data.ok) {
        console.info(`[ARDS Alert] ✅ Dispatched ${data.sent} message(s) for ${riskType} HIGH risk.`);
        if (typeof window.showArdsToast === 'function') {
          window.showArdsToast(
            `✅ Alert sent (${data.sent} message${data.sent !== 1 ? 's' : ''} — SMS & WhatsApp)`,
            'success'
          );
        }
      } else {
        console.warn('[ARDS Alert] Partial failure:', data);
        if (typeof window.showArdsToast === 'function') {
          window.showArdsToast('⚠️ Alert sent with some failures — check console.', 'warning');
        }
      }

      if (data.errors && data.errors.length) {
        data.errors.forEach(e => console.warn(`[ARDS Alert] ${e.channel} → ${e.to}: ${e.error}`));
      }
    } catch (err) {
      console.error('[ARDS Alert] Network error dispatching alert:', err);
      if (typeof window.showArdsToast === 'function') {
        window.showArdsToast('❌ Alert network error — check connection.', 'error');
      }
    }
  }

  /**
   * Observe risk without dispatching (placeholder for future enhancements).
   * Called when risk monitoring is active but no HIGH-risk condition is present.
   */
  function observeRisk(opts = {}) {
    // Currently a no-op — can be extended for risk tracking/analytics
    console.debug('[ARDS Alert] Risk observed:', opts.riskBand, opts.patientName);
  }

  /* Public API */
  window.ardsAlert = { dispatch, observeRisk };

})();
