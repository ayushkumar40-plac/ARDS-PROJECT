'use strict';

require('dotenv').config();

const express = require('express');
const cors = require('cors');
const twilio = require('twilio');
const { buildMessages } = require('./messages');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const xss = require('xss-clean');

const PORT = Number(process.env.PORT) || 8787;
const ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID || '';
const AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN || '';
const SMS_FROM = process.env.TWILIO_SMS_FROM || '';
const WHATSAPP_FROM = process.env.TWILIO_WHATSAPP_FROM || '';
const DEDUPE_WINDOW_MS = (Number(process.env.DEDUPE_WINDOW_MINUTES) || 15) * 60 * 1000;

const credentialsPresent = Boolean(ACCOUNT_SID && AUTH_TOKEN && SMS_FROM && WHATSAPP_FROM);
const DRY_RUN = String(process.env.DRY_RUN).toLowerCase() === 'true' || !credentialsPresent;

const client = credentialsPresent ? twilio(ACCOUNT_SID, AUTH_TOKEN) : null;

const app = express();

// Security middleware
app.use(helmet({
  contentSecurityPolicy: false, // Disable CSP for API endpoints
  crossOriginEmbedderPolicy: false
}));

app.use(xss());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false
});

const strictLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Stricter limit for sensitive endpoints
  message: 'Too many requests from this IP, please try again later.'
});

app.use('/api/notify/', strictLimiter);
app.use(limiter);

// Body parsing with size limits
app.use(express.json({ 
  limit: '64kb',
  strict: true
}));

app.use(express.urlencoded({ 
  extended: true, 
  limit: '64kb' 
}));

// CORS configuration
const allowedOrigins = (process.env.ALLOWED_ORIGINS || '*')
  .split(',')
  .map(o => o.trim())
  .filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.includes('*')) {
      return callback(null, true);
    }
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      return callback(null, true);
    }
    
    callback(new Error('Not allowed by CORS'));
  },
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  maxAge: 600 // 10 minutes
}));

// Request logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`${req.method} ${req.path} ${res.statusCode} - ${duration}ms - ${req.ip}`);
  });
  
  next();
});

// Security headers
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});

const E164 = /^\+[1-9]\d{6,14}$/;
const recentAlerts = new Map();

function normalizePhone(value) {
  return String(value || '').replace(/[\s()-]/g, '');
}

// Input sanitization
function sanitizeString(value) {
  if (typeof value !== 'string') return '';
  return value.trim().replace(/[<>]/g, '');
}

function sanitizeNumber(value) {
  const num = Number(value);
  return Number.isNaN(num) ? 0 : num;
}

// Enhanced validation with security checks
function validate(payload) {
  const errors = [];
  const patient = payload.patient || {};
  const doctor = payload.doctor || {};
  const risk = payload.risk || {};

  // Patient validation
  if (!patient.name) {
    errors.push('patient.name is required');
  } else if (typeof patient.name !== 'string' || patient.name.length > 100) {
    errors.push('patient.name must be a string with max 100 characters');
  } else {
    patient.name = sanitizeString(patient.name);
  }

  if (!patient.phone) {
    errors.push('patient.phone is required');
  } else if (!E164.test(normalizePhone(patient.phone))) {
    errors.push('patient.phone must be E.164 (e.g. +14155551234)');
  }

  // Doctor validation
  if (!doctor.name) {
    errors.push('doctor.name is required');
  } else if (typeof doctor.name !== 'string' || doctor.name.length > 100) {
    errors.push('doctor.name must be a string with max 100 characters');
  } else {
    doctor.name = sanitizeString(doctor.name);
  }

  if (!doctor.phone) {
    errors.push('doctor.phone is required');
  } else if (!E164.test(normalizePhone(doctor.phone))) {
    errors.push('doctor.phone must be E.164 (e.g. +14155551234)');
  }

  // Risk validation
  if (typeof risk.score !== 'number' || Number.isNaN(risk.score)) {
    errors.push('risk.score must be a number');
  } else if (risk.score < 0 || risk.score > 100) {
    errors.push('risk.score must be between 0 and 100');
  } else {
    risk.score = sanitizeNumber(risk.score);
  }

  if (!risk.band) {
    errors.push('risk.band is required');
  } else if (typeof risk.band !== 'string' || !['low', 'moderate', 'high', 'critical'].includes(risk.band.toLowerCase())) {
    errors.push('risk.band must be one of: low, moderate, high, critical');
  }

  // Additional security checks
  if (patient.id && typeof patient.id !== 'string') {
    errors.push('patient.id must be a string');
  }

  if (risk.sessionNumber && (typeof risk.sessionNumber !== 'number' || risk.sessionNumber < 1)) {
    errors.push('risk.sessionNumber must be a positive number');
  }

  if (risk.severity && typeof risk.severity !== 'string') {
    errors.push('risk.severity must be a string');
  }

  return errors;
}

// IP-based rate limiting for deduplication
const ipRequestLog = new Map();
const MAX_REQUESTS_PER_IP_PER_MINUTE = 30;

function checkIPRateLimit(ip) {
  const now = Date.now();
  const requests = ipRequestLog.get(ip) || [];
  
  // Remove requests older than 1 minute
  const recentRequests = requests.filter(time => now - time < 60000);
  
  if (recentRequests.length >= MAX_REQUESTS_PER_IP_PER_MINUTE) {
    return false;
  }
  
  recentRequests.push(now);
  ipRequestLog.set(ip, recentRequests);
  
  // Clean up old entries periodically
  if (Math.random() < 0.1) {
    for (const [key, times] of ipRequestLog) {
      const validTimes = times.filter(time => now - time < 60000);
      if (validTimes.length === 0) {
        ipRequestLog.delete(key);
      } else {
        ipRequestLog.set(key, validTimes);
      }
    }
  }
  
  return true;
}

function dedupeKey(payload) {
  return [payload.patient.id || payload.patient.name, payload.risk.sessionNumber, payload.risk.severity].join('|');
}

function isDuplicate(key) {
  const seenAt = recentAlerts.get(key);
  if (seenAt && Date.now() - seenAt < DEDUPE_WINDOW_MS) return true;
  recentAlerts.set(key, Date.now());
  for (const [k, t] of recentAlerts) {
    if (Date.now() - t > DEDUPE_WINDOW_MS) recentAlerts.delete(k);
  }
  return false;
}

async function send(recipient, channel, to, body) {
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

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    dryRun: DRY_RUN,
    credentialsPresent,
    smsFrom: SMS_FROM || null,
    whatsappFrom: WHATSAPP_FROM || null,
    timestamp: new Date().toISOString()
  });
});

app.post('/api/notify/risk', async (req, res) => {
  // IP-based rate limiting check
  const clientIP = req.ip || req.connection.remoteAddress;
  if (!checkIPRateLimit(clientIP)) {
    return res.status(429).json({ 
      status: 'error', 
      message: 'Too many requests from this IP. Please try again later.' 
    });
  }

  // Validate request body exists
  if (!req.body || typeof req.body !== 'object') {
    return res.status(400).json({ 
      status: 'invalid', 
      errors: ['Request body must be a valid JSON object'] 
    });
  }

  const payload = req.body;
  const errors = validate(payload);
  
  if (errors.length) {
    return res.status(400).json({ 
      status: 'invalid', 
      errors,
      timestamp: new Date().toISOString()
    });
  }

  // Sanitize phone numbers
  payload.patient.phone = normalizePhone(payload.patient.phone);
  payload.doctor.phone = normalizePhone(payload.doctor.phone);

  // Check for duplicates
  const key = dedupeKey(payload);
  if (isDuplicate(key)) {
    return res.status(200).json({ 
      status: 'duplicate', 
      key, 
      results: [],
      timestamp: new Date().toISOString()
    });
  }

  try {
    const messages = buildMessages(payload);
    const results = await Promise.all([
      send('patient', 'sms', payload.patient.phone, messages.patient.sms),
      send('patient', 'whatsapp', payload.patient.phone, messages.patient.whatsapp),
      send('doctor', 'sms', payload.doctor.phone, messages.doctor.sms),
      send('doctor', 'whatsapp', payload.doctor.phone, messages.doctor.whatsapp)
    ]);

    const failed = results.filter(r => r.status === 'failed');
    res.status(failed.length === results.length ? 502 : 200).json({
      status: DRY_RUN ? 'dry-run' : (failed.length ? 'partial' : 'sent'),
      results,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error processing notification request:', error);
    res.status(500).json({ 
      status: 'error', 
      message: 'Internal server error',
      timestamp: new Date().toISOString()
    });
  }
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`ARDS alert service listening on http://localhost:${PORT} (dryRun=${DRY_RUN})`);
  });
}

module.exports = app;
