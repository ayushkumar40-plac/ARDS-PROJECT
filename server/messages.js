'use strict';

/**
 * Message composition for at-risk rehabilitation alerts.
 * SMS bodies are kept to a single short sentence; WhatsApp bodies carry the
 * clinical detail.
 */

const SEVERITY_LABEL = {
  critical: 'URGENT',
  warning: 'Attention'
};

function severityLabel(severity) {
  return SEVERITY_LABEL[severity] || 'Attention';
}

function firstName(name) {
  return String(name || 'there').trim().split(/\s+/)[0];
}

function formatScore(score) {
  return Number(score).toFixed(1);
}

function reasonLines(reasons) {
  if (!Array.isArray(reasons) || reasons.length === 0) return [];
  return reasons.map(r => `• ${r}`);
}

function buildPatientSms(payload) {
  const { patient, doctor, risk } = payload;
  return `ARDS ${severityLabel(risk.severity)}: Hi ${firstName(patient.name)}, your rehab score is ${formatScore(risk.score)}/100 (${risk.band}) after session ${risk.sessionNumber}. Please pause training and contact ${doctor.name || 'your clinician'}.`;
}

function buildDoctorSms(payload) {
  const { patient, risk } = payload;
  return `ARDS ${severityLabel(risk.severity)}: ${patient.name} (${patient.id}) session ${risk.sessionNumber} rehab score ${formatScore(risk.score)}/100 (${risk.band}), state ${risk.state}. Clinical review required.`;
}

function buildPatientWhatsApp(payload) {
  const { patient, doctor, risk } = payload;
  const lines = [
    `*ARDS Rehabilitation Alert — ${severityLabel(risk.severity)}*`,
    '',
    `Hi ${firstName(patient.name)}, your latest session was flagged as at risk.`,
    '',
    `*Rehab score:* ${formatScore(risk.score)}/100 (${risk.band})`,
    `*Session:* ${risk.sessionNumber}${risk.date ? ` · ${risk.date}` : ''}`,
    ''
  ];
  const reasons = reasonLines(risk.reasons);
  if (reasons.length) {
    lines.push('*What we noticed:*', ...reasons, '');
  }
  lines.push(
    '*What to do now:*',
    '• Stop your current training session.',
    '• Remove the prosthesis and check your residual limb for redness or soreness.',
    `• Contact ${doctor.name || 'your clinician'}${doctor.phone ? ` on ${doctor.phone}` : ''}.`,
    '',
    'Your care team has also been notified.'
  );
  return lines.join('\n');
}

function buildDoctorWhatsApp(payload) {
  const { patient, risk } = payload;
  const lines = [
    `*ARDS Clinical Alert — ${severityLabel(risk.severity)}*`,
    '',
    `*Patient:* ${patient.name} (${patient.id})`,
    `*Session:* ${risk.sessionNumber}${risk.date ? ` · ${risk.date}` : ''}`,
    `*Rehab score:* ${formatScore(risk.score)}/100 (${risk.band})`,
    `*Condition state:* ${risk.state}`,
    `*Safety flag:* ${risk.safetyFlag || 'n/a'}`,
    ''
  ];
  const reasons = reasonLines(risk.reasons);
  if (reasons.length) {
    lines.push('*Risk drivers:*', ...reasons, '');
  }
  if (risk.recommendation) {
    lines.push('*Engine recommendation:*', risk.recommendation, '');
  }
  if (patient.phone) {
    lines.push(`Patient contacted on ${patient.phone}.`);
  }
  return lines.join('\n').trim();
}

/**
 * @returns {{patient: {sms: string, whatsapp: string}, doctor: {sms: string, whatsapp: string}}}
 */
function buildMessages(payload) {
  return {
    patient: {
      sms: buildPatientSms(payload),
      whatsapp: buildPatientWhatsApp(payload)
    },
    doctor: {
      sms: buildDoctorSms(payload),
      whatsapp: buildDoctorWhatsApp(payload)
    }
  };
}

module.exports = { buildMessages };
