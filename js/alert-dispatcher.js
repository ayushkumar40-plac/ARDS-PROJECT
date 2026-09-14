/* ==========================================================================
 * ARDS — High-Risk Alert Dispatcher (js/alert-dispatcher.js)
 * --------------------------------------------------------------------------
 * Entry point for HIGH-risk alerts raised outside the session pipeline
 * (safety-governor flags, clinical reference checks and manual tests).
 *
 * All deliveries are delegated to window.ardsRiskNotifier (js/notifications.js),
 * which posts to the alert service's /api/notify/risk endpoint — the same
 * working path used by the "At-Risk SMS & WhatsApp Notifications" panel in
 * the Alerts tab. Contact numbers come from the active patient record and
 * can be edited from either the About tab's Alert Contacts card or the
 * Alerts tab settings; both write to the same place.
 *
 * Usage:
 *   window.ardsAlert.dispatch({
 *     riskBand,                    — must be 'HIGH' to fire
 *     riskType, riskScore, detail, patientName, patientId, sessionId,
 *     severity,                    — 'critical' (default) | 'warning'
 *     force                        — bypass the per-session dedupe log
 *   })
 * ========================================================================== */
(function () {
  'use strict';

  function resolvePatient(patientId, patientName) {
    const store = window.dataStore;
    let patient = null;
    if (store && typeof store.getPatient === 'function' && patientId) {
      patient = store.getPatient(patientId);
    }
    if (!patient && store && typeof store.getActivePatient === 'function') {
      patient = store.getActivePatient();
    }
    if (!patient) return null;
    // Manual tests may override the display name; contacts stay on the record.
    return patientName ? { ...patient, name: patientName } : patient;
  }

  function resolveSession(patient, sessionId) {
    const store = window.dataStore;
    if (store && typeof store.getActiveSession === 'function') {
      const active = store.getActiveSession();
      if (active) return active;
    }
    const listed = patient.sessions && patient.sessions.length
      ? patient.sessions.find(s => s.session === sessionId) || patient.sessions[patient.sessions.length - 1]
      : null;
    if (listed) return listed;
    return { session: 1, date: new Date().toISOString().slice(0, 10) };
  }

  function toast(message, tone) {
    if (typeof window.showArdsToast === 'function') {
      window.showArdsToast(message, tone);
    }
  }

  /**
   * Dispatch a HIGH-risk alert through the shared risk-notifier pipeline.
   * @returns {Promise<void>}
   */
  async function dispatch(opts = {}) {
    const {
      riskBand, riskType, riskScore, detail,
      patientName, patientId, sessionId, severity, force
    } = opts;

    // Only fire for HIGH risk
    if (riskBand !== 'HIGH') return;

    const notifier = window.ardsRiskNotifier;
    if (!notifier) {
      console.warn('[ARDS Alert] Risk notifier not loaded (js/notifications.js).');
      toast('⚠️ Alert service unavailable — notification module not loaded.', 'warning');
      return;
    }

    const patient = resolvePatient(patientId, patientName);
    if (!patient) {
      console.warn('[ARDS Alert] No patient record available for dispatch.');
      return;
    }

    if (!notifier.isValidPhone(patient.phone) && !notifier.isValidPhone(patient.clinicianPhone)) {
      console.warn('[ARDS Alert] No phone numbers configured on the patient record.');
      toast('⚠️ HIGH risk detected — no alert contacts configured. Add patient and clinician numbers in the Alerts or About tab.', 'warning');
      return;
    }

    const session = resolveSession(patient, sessionId);

    const risk = {
      score: Math.max(0, Math.min(100, Number(riskScore) || 0)),
      band: 'high',
      state: 'HIGH_RISK',
      severity: severity === 'warning' ? 'warning' : 'critical',
      safetyFlag: riskType || null,
      reasons: [detail || 'HIGH risk condition detected — immediate clinical review required.'],
      recommendation: 'Stop the session and review the patient before continuing rehabilitation.',
      sessionNumber: session.session,
      date: session.date,
      atRisk: true
    };

    toast(`🚨 HIGH RISK (${riskType || 'Safety'}) — Sending SMS & WhatsApp alert…`, 'error');

    const outcome = await notifier.deliverAlert(patient, session, risk, { force: Boolean(force) });

    switch (outcome.status) {
      case 'sent':
        toast('✅ Alert sent — SMS & WhatsApp delivered to patient and clinician.', 'success');
        break;
      case 'partial':
        toast('⚠️ Alert sent, but some deliveries failed — check the service logs.', 'warning');
        break;
      case 'dry-run':
        toast('🕵️ Alert service is in dry-run mode — messages composed but not sent (no Twilio credentials).', 'warning');
        break;
      case 'duplicate':
        toast('ℹ️ A matching alert was sent recently — not re-sent (dedupe window).', 'info');
        break;
      case 'missing-contacts':
        toast('⚠️ Could not send: patient and clinician phones must both be valid E.164 numbers (e.g. +14155551234).', 'warning');
        break;
      case 'failed':
        toast(`❌ Alert failed: ${outcome.reason}`, 'error');
        break;
      default:
        if (outcome.reason) console.info(`[ARDS Alert] ${outcome.status}: ${outcome.reason}`);
    }

    if (outcome.result && Array.isArray(outcome.result.results)) {
      outcome.result.results
        .filter(r => r.status === 'failed')
        .forEach(r => console.warn(`[ARDS Alert] ${r.channel} → ${r.to}: ${r.error}`));
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
