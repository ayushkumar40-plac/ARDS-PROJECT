module.exports = function handler(req, res) {
  const ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID || '';
  const AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN || '';
  const SMS_FROM = process.env.TWILIO_SMS_FROM || '';
  const WHATSAPP_FROM = process.env.TWILIO_WHATSAPP_FROM || '';
  const credentialsPresent = Boolean(ACCOUNT_SID && AUTH_TOKEN && SMS_FROM && WHATSAPP_FROM);
  const DRY_RUN = String(process.env.DRY_RUN).toLowerCase() === 'true' || !credentialsPresent;
  
  res.json({
    status: 'ok',
    dryRun: DRY_RUN,
    credentialsPresent,
    smsFrom: SMS_FROM || null,
    whatsappFrom: WHATSAPP_FROM || null
  });
}
