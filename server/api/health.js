module.exports = async function handler(req, res) {
  // Allow CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ status: 'error', message: 'Method not allowed' });
  }

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
