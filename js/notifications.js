/**
 * ARDS - Adaptive Rehabilitation Decision Support System
 * At-Risk Notification Layer (Twilio SMS + WhatsApp via the alert service)
 *
 * The dashboard is a static app, so message delivery is delegated to the
 * Node service in /server, which holds the Twilio credentials.
 */

class ARDSRiskNotifier {
  constructor() {
    this.CONFIG_KEY = 'ards_notify_config_v1';
    this.SENT_KEY = 'ards_notify_sent_v1';
    this.DEFAULTS = {
      apiBaseUrl: 'https://ards-alert-service.vercel.app',
      autoNotify: true
    };
  }

  getConfig() {
    try {
      const saved = JSON.parse(localStorage.getItem(this.CONFIG_KEY) || '{}');
      return { ...this.DEFAULTS, ...saved };
    } catch (e) {
      return { ...this.DEFAULTS };
    }
  }

  saveConfig(patch) {
    const next = { ...this.getConfig(), ...patch };
    localStorage.setItem(this.CONFIG_KEY, JSON.stringify(next));
    return next;
  }

  isValidPhone(value) {
    return /^\+[1-9]\d{6,14}$/.test(String(value || '').replace(/[\s()-]/g, ''));
  }

  getSentLog() {
    try {
      return JSON.parse(localStorage.getItem(this.SENT_KEY) || '{}');
    } catch (e) {
      return {};
    }
  }

  markSent(key) {
    const log = this.getSentLog();
    log[key] = new Date().toISOString();
    localStorage.setItem(this.SENT_KEY, JSON.stringify(log));
  }

  alreadySent(key) {
    return Boolean(this.getSentLog()[key]);
  }

  buildPayload(patient, session, risk) {
    return {
      patient: {
        id: patient.id,
        name: patient.name,
        phone: patient.phone
      },
      doctor: {
        name: patient.clinician,
        phone: patient.clinicianPhone
      },
      risk: {
        score: risk.score,
        band: risk.band,
        state: risk.state,
        severity: risk.severity,
        safetyFlag: risk.safetyFlag,
        reasons: risk.reasons,
        recommendation: risk.recommendation,
        sessionNumber: session.session,
        date: session.date
      }
    };
  }

  async postAlert(payload) {
    const { apiBaseUrl } = this.getConfig();
    const response = await fetch(`${apiBaseUrl.replace(/\/$/, '')}/api/notify/risk`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(body.errors ? body.errors.join('; ') : `Alert service responded ${response.status}`);
    }
    return body;
  }

  async checkServiceHealth() {
    const { apiBaseUrl } = this.getConfig();
    const response = await fetch(`${apiBaseUrl.replace(/\/$/, '')}/api/health`);
    if (!response.ok) throw new Error(`Alert service responded ${response.status}`);
    return response.json();
  }

  /**
   * Evaluates the session and, when the patient is at risk, dispatches the
   * SMS + WhatsApp alerts to both the patient and the treating clinician.
   * @param {Object} options - { force } bypasses the auto-notify setting and
   *        the per-session send log (used by the manual "Notify now" button).
   */
  async evaluateAndNotify(patient, session, baseline, previousSession, options = {}) {
    if (!patient || !session) return { status: 'skipped', reason: 'No active session' };

    const risk = window.ardsEngine.assessRisk(session, baseline, previousSession);
    const config = this.getConfig();

    if (!risk.atRisk && !options.force) {
      return { status: 'skipped', reason: 'Patient is not at risk', risk };
    }
    if (!config.autoNotify && !options.force) {
      return { status: 'skipped', reason: 'Automatic notifications are disabled', risk };
    }
    if (!this.isValidPhone(patient.phone) || !this.isValidPhone(patient.clinicianPhone)) {
      return { status: 'missing-contacts', reason: 'Patient and clinician phone numbers must be in E.164 format', risk };
    }

    const key = `${patient.id}|${session.session}|${risk.severity}`;
    if (!options.force && this.alreadySent(key)) {
      return { status: 'skipped', reason: 'Alert already sent for this session', risk };
    }

    try {
      const result = await this.postAlert(this.buildPayload(patient, session, risk));
      this.markSent(key);
      this.logDelivery(patient, session, risk, result);
      return { status: result.status, result, risk };
    } catch (error) {
      return { status: 'failed', reason: error.message, risk };
    }
  }

  logDelivery(patient, session, risk, result) {
    const delivered = (result.results || []).filter(r => r.status === 'sent' || r.status === 'dry-run');
    const channels = delivered.map(r => `${r.recipient} ${r.channel.toUpperCase()}`).join(', ') || 'none';
    const prefix = result.status === 'dry-run' ? 'Simulated (dry run)' : 'Delivered';
    window.dataStore.addAlert(patient.id, {
      session: session.session,
      type: risk.severity === 'critical' ? 'critical' : 'warning',
      title: `At-Risk Alert Sent (score ${risk.score})`,
      message: `${prefix} SMS + WhatsApp notifications to ${patient.name} and ${patient.clinician || 'the treating clinician'}. Channels: ${channels}.`
    });
  }
}

window.ardsRiskNotifier = new ARDSRiskNotifier();
