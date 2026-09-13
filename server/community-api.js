'use strict';

require('dotenv').config();

const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const xss = require('xss-clean');
const crypto = require('crypto');

const PORT = Number(process.env.COMMUNITY_PORT) || 8788;
const JWT_SECRET = process.env.JWT_SECRET || crypto.randomBytes(32).toString('hex');

const app = express();

// Security middleware
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false
}));

app.use(xss());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false
});

const strictLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: 'Too many requests from this IP, please try again later.'
});

app.use('/api/community/posts', strictLimiter);
app.use('/api/community/connect', strictLimiter);
app.use(limiter);

// Body parsing
app.use(express.json({ 
  limit: '100kb',
  strict: true
}));

app.use(express.urlencoded({ 
  extended: true, 
  limit: '100kb' 
}));

// CORS configuration
const allowedOrigins = (process.env.ALLOWED_ORIGINS || '*')
  .split(',')
  .map(o => o.trim())
  .filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.includes('*')) {
      return callback(null, true);
    }
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      return callback(null, true);
    }
    
    callback(new Error('Not allowed by CORS'));
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  maxAge: 600
}));

// Security headers
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});

// Request logging
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`${req.method} ${req.path} ${res.statusCode} - ${duration}ms - ${req.ip}`);
  });
  next();
});

// Input sanitization
function sanitizeString(value, maxLength = 1000) {
  if (typeof value !== 'string') return '';
  const sanitized = value.trim().replace(/[<>]/g, '');
  return sanitized.substring(0, maxLength);
}

function sanitizeNumber(value, min = 0, max = 100) {
  const num = Number(value);
  if (Number.isNaN(num)) return min;
  return Math.max(min, Math.min(max, num));
}

function sanitizeEmail(value) {
  if (typeof value !== 'string') return '';
  const email = value.trim().toLowerCase();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) ? email : '';
}

// Validation functions
function validatePost(post) {
  const errors = [];
  
  if (!post.content || typeof post.content !== 'string') {
    errors.push('Post content is required and must be a string');
  } else if (post.content.length < 10 || post.content.length > 5000) {
    errors.push('Post content must be between 10 and 5000 characters');
  }
  
  if (post.author && typeof post.author !== 'string') {
    errors.push('Author must be a string');
  } else if (post.author && post.author.length > 100) {
    errors.push('Author name must be less than 100 characters');
  }
  
  if (post.category && !['achievement', 'question', 'tip', 'update', 'encouragement'].includes(post.category)) {
    errors.push('Invalid post category');
  }
  
  return errors;
}

function validateMemberProfile(profile) {
  const errors = [];
  
  if (profile.name && (typeof profile.name !== 'string' || profile.name.length > 100)) {
    errors.push('Name must be a string with max 100 characters');
  }
  
  if (profile.bio && (typeof profile.bio !== 'string' || profile.bio.length > 500)) {
    errors.push('Bio must be a string with max 500 characters');
  }
  
  if (profile.age && (typeof profile.age !== 'number' || profile.age < 18 || profile.age > 120)) {
    errors.push('Age must be a number between 18 and 120');
  }
  
  if (profile.location && typeof profile.location !== 'string') {
    errors.push('Location must be a string');
  }
  
  return errors;
}

function validateScoreShare(scoreData) {
  const errors = [];
  
  if (typeof scoreData.score !== 'number' || scoreData.score < 0 || scoreData.score > 100) {
    errors.push('Score must be a number between 0 and 100');
  }
  
  if (scoreData.previousScore !== undefined && (typeof scoreData.previousScore !== 'number' || scoreData.previousScore < 0 || scoreData.previousScore > 100)) {
    errors.push('Previous score must be a number between 0 and 100');
  }
  
  if (scoreData.message && (typeof scoreData.message !== 'string' || scoreData.message.length > 500)) {
    errors.push('Message must be a string with max 500 characters');
  }
  
  return errors;
}

// Simple token validation (in production, use proper JWT)
function validateToken(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ error: 'Authorization token required' });
  }
  
  // In production, verify JWT token here
  // For now, we'll do a basic check
  if (token.length < 10) {
    return res.status(401).json({ error: 'Invalid token' });
  }
  
  next();
}

// In-memory storage (in production, use a database)
const posts = [];
const connections = [];
const sharedScores = [];

// API Routes

// Health check
app.get('/api/community/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Get all posts
app.get('/api/community/posts', (req, res) => {
  const limit = parseInt(req.query.limit) || 20;
  const offset = parseInt(req.query.offset) || 0;
  
  const paginatedPosts = posts.slice(offset, offset + limit);
  
  res.json({
    posts: paginatedPosts,
    total: posts.length,
    limit,
    offset
  });
});

// Create new post
app.post('/api/community/posts', validateToken, (req, res) => {
  const errors = validatePost(req.body);
  
  if (errors.length > 0) {
    return res.status(400).json({ errors });
  }
  
  const newPost = {
    id: Date.now(),
    content: sanitizeString(req.body.content, 5000),
    author: req.body.author ? sanitizeString(req.body.author, 100) : 'Anonymous',
    category: req.body.category || 'update',
    timestamp: new Date().toISOString(),
    likes: 0,
    comments: 0
  };
  
  posts.unshift(newPost);
  
  res.status(201).json({
    post: newPost,
    message: 'Post created successfully'
  });
});

// Like a post
app.post('/api/community/posts/:id/like', validateToken, (req, res) => {
  const postId = parseInt(req.params.id);
  const post = posts.find(p => p.id === postId);
  
  if (!post) {
    return res.status(404).json({ error: 'Post not found' });
  }
  
  post.likes++;
  
  res.json({ post });
});

// Comment on a post
app.post('/api/community/posts/:id/comment', validateToken, (req, res) => {
  const postId = parseInt(req.params.id);
  const post = posts.find(p => p.id === postId);
  
  if (!post) {
    return res.status(404).json({ error: 'Post not found' });
  }
  
  if (!req.body.comment || typeof req.body.comment !== 'string' || req.body.comment.length > 500) {
    return res.status(400).json({ error: 'Comment must be a string with max 500 characters' });
  }
  
  post.comments++;
  
  res.json({ post });
});

// Connect with member
app.post('/api/community/connect', validateToken, (req, res) => {
  const { memberId, message } = req.body;
  
  if (!memberId) {
    return res.status(400).json({ error: 'Member ID is required' });
  }
  
  if (message && (typeof message !== 'string' || message.length > 500)) {
    return res.status(400).json({ error: 'Message must be a string with max 500 characters' });
  }
  
  const connection = {
    id: Date.now(),
    memberId: sanitizeNumber(memberId),
    message: message ? sanitizeString(message, 500) : '',
    timestamp: new Date().toISOString(),
    status: 'pending'
  };
  
  connections.push(connection);
  
  res.status(201).json({
    connection,
    message: 'Connection request sent'
  });
});

// Share score
app.post('/api/community/scores', validateToken, (req, res) => {
  const errors = validateScoreShare(req.body);
  
  if (errors.length > 0) {
    return res.status(400).json({ errors });
  }
  
  const scoreShare = {
    id: Date.now(),
    score: sanitizeNumber(req.body.score, 0, 100),
    previousScore: req.body.previousScore ? sanitizeNumber(req.body.previousScore, 0, 100) : null,
    message: req.body.message ? sanitizeString(req.body.message, 500) : '',
    timestamp: new Date().toISOString()
  };
  
  sharedScores.unshift(scoreShare);
  
  res.status(201).json({
    scoreShare,
    message: 'Score shared successfully'
  });
});

// Get shared scores
app.get('/api/community/scores', (req, res) => {
  const limit = parseInt(req.query.limit) || 20;
  const offset = parseInt(req.query.offset) || 0;
  
  const paginatedScores = sharedScores.slice(offset, offset + limit);
  
  res.json({
    scores: paginatedScores,
    total: sharedScores.length,
    limit,
    offset
  });
});

// Report content
app.post('/api/community/report', validateToken, (req, res) => {
  const { contentType, contentId, reason } = req.body;
  
  if (!contentType || !contentId) {
    return res.status(400).json({ error: 'Content type and ID are required' });
  }
  
  if (!reason || typeof reason !== 'string' || reason.length < 10 || reason.length > 500) {
    return res.status(400).json({ error: 'Reason must be a string between 10 and 500 characters' });
  }
  
  // Log the report (in production, save to database)
  console.log('Content reported:', { contentType, contentId, reason, timestamp: new Date().toISOString() });
  
  res.json({
    message: 'Report submitted successfully. Our team will review it shortly.'
  });
});

// Block user
app.post('/api/community/block', validateToken, (req, res) => {
  const { userId } = req.body;
  
  if (!userId) {
    return res.status(400).json({ error: 'User ID is required' });
  }
  
  // Log the block action (in production, save to database)
  console.log('User blocked:', { userId, timestamp: new Date().toISOString() });
  
  res.json({
    message: 'User blocked successfully'
  });
});

// Error handling
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'An error occurred'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not found',
    message: 'The requested endpoint does not exist'
  });
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`ARDS Community API listening on http://localhost:${PORT}`);
    console.log(`JWT Secret: ${JWT_SECRET.substring(0, 8)}...`);
  });
}

module.exports = app;
