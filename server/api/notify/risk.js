const twilio = require('twilio');
const { buildMessages } = require('../../messages');

const E164 = /^\+[1-9]\d{6,14}$/;
const recentAlerts = new Map();

function normalizePhone(value) {
  return String(value || '').replace(/[\s()-]/g, '');
}

function validate(payload) {
  const errors = [];
  const patient = payload.patient || {};
  const doctor = payload.doctor || {};
  const risk = payload.risk || {};

  if (!patient.name) errors.push('patient.name is required');
  if (!E164.test(normalizePhone(patient.phone))) errors.push('patient.phone must be E.164 (e.g. +14155551234)');
  if (!E164.test(normalizePhone(doctor.phone))) errors.push('doctor.phone must be E.164 (e.g. +14155551234)');
  if (typeof risk.score !== 'number' || Number.isNaN(risk.score)) errors.push('risk.score must be a number');
  if (!risk.band) errors.push('risk.band is required');

  return errors;
}

function dedupeKey(payload) {
  return [payload.patient.id || payload.patient.name, payload.risk.sessionNumber, payload.risk.severity].join('|');
}

function isDuplicate(key) {
  const seenAt = recentAlerts.get(key);
  const DEDUPE_WINDOW_MS = (Number(process.env.DEDUPE_WINDOW_MINUTES) || 15) * 60 * 1000;
  if (seenAt && Date.now() - seenAt < DEDUPE_WINDOW_MS) return true;
  recentAlerts.set(key, Date.now());
  for (const [k, t] of recentAlerts) {
    if (Date.now() - t > DEDUPE_WINDOW_MS) recentAlerts.delete(k);
  }
  return false;
}

async function send(recipient, channel, to, body) {
  const ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID || '';
  const AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN || '';
  const SMS_FROM = process.env.TWILIO_SMS_FROM || '';
  const WHATSAPP_FROM = process.env.TWILIO_WHATSAPP_FROM || '';
  const credentialsPresent = Boolean(ACCOUNT_SID && AUTH_TOKEN && SMS_FROM && WHATSAPP_FROM);
  const DRY_RUN = String(process.env.DRY_RUN).toLowerCase() === 'true' || !credentialsPresent;
  
  const client = credentialsPresent ? twilio(ACCOUNT_SID, AUTH_TOKEN) : null;
  const target = channel === 'whatsapp' ? `whatsapp:${to}` : to;
  const from = channel === 'whatsapp' ? WHATSAPP_FROM : SMS_FROM;

  if (DRY_RUN) {
    console.log(`[dry-run] ${channel} → ${target}\n${body}\n`);
    return { recipient, channel, to: target, status: 'dry-run' };
  }

  try {
    const message = await client.messages.create({ from, to: target, body });
    return { recipient, channel, to: target, status: 'sent', sid: message.sid };
  } catch (err) {
    console.error(`Failed to send ${channel} to ${target}:`, err.message);
    return { recipient, channel, to: target, status: 'failed', error: err.message };
  }
}

module.exports = async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ status: 'error', message: 'Method not allowed' });
  }

  const payload = req.body || {};
  const errors = validate(payload);
  if (errors.length) {
    return res.status(400).json({ status: 'invalid', errors });
  }

  payload.patient.phone = normalizePhone(payload.patient.phone);
  payload.doctor.phone = normalizePhone(payload.doctor.phone);

  const key = dedupeKey(payload);
  if (isDuplicate(key)) {
    return res.status(200).json({ status: 'duplicate', key, results: [] });
  }

  const messages = buildMessages(payload);
  const results = await Promise.all([
    send('patient', 'sms', payload.patient.phone, messages.patient.sms),
    send('patient', 'whatsapp', payload.patient.phone, messages.patient.whatsapp),
    send('doctor', 'sms', payload.doctor.phone, messages.doctor.sms),
    send('doctor', 'whatsapp', payload.doctor.phone, messages.doctor.whatsapp)
  ]);

  const ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID || '';
  const AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN || '';
  const SMS_FROM = process.env.TWILIO_SMS_FROM || '';
  const WHATSAPP_FROM = process.env.TWILIO_WHATSAPP_FROM || '';
  const credentialsPresent = Boolean(ACCOUNT_SID && AUTH_TOKEN && SMS_FROM && WHATSAPP_FROM);
  const DRY_RUN = String(process.env.DRY_RUN).toLowerCase() === 'true' || !credentialsPresent;

  const failed = results.filter(r => r.status === 'failed');
  res.status(failed.length === results.length ? 502 : 200).json({
    status: DRY_RUN ? 'dry-run' : (failed.length ? 'partial' : 'sent'),
    results,
    messages
  });
};
