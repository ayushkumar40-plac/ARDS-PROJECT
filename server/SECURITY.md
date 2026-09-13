# Security Configuration Guide

## Environment Variables

Create a `.env` file in the server directory with the following variables:

### Twilio Configuration
```
TWILIO_ACCOUNT_SID=your_account_sid_here
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_SMS_FROM=+14155551234
TWILIO_WHATSAPP_FROM=whatsapp:+14155238886
```

### Service Configuration
```
PORT=8787
ALLOWED_ORIGINS=https://ardss-project.vercel.app,https://ards-alert-service.vercel.app
DRY_RUN=false
DEDUPE_WINDOW_MINUTES=15
```

### Security Configuration
```
JWT_SECRET=generate_a_random_32_character_secret_key_here
COMMUNITY_PORT=8788
NODE_ENV=production
```

## Security Features Implemented

### 1. Rate Limiting
- **General Limit:** 100 requests per 15 minutes per IP
- **Strict Limit:** 10 requests per 15 minutes for sensitive endpoints
- **IP-based Logging:** Tracks request frequency per IP address

### 2. Input Validation & Sanitization
- **String Sanitization:** Removes dangerous characters, enforces length limits
- **Number Validation:** Ensures numbers are within valid ranges
- **Email Validation:** Validates email format
- **XSS Protection:** Using `xss-clean` middleware

### 3. CORS Configuration
- **Origin Whitelisting:** Only allows requests from specified origins
- **Method Restrictions:** Only allows GET and POST methods
- **Header Restrictions:** Only allows specific headers
- **Credentials Management:** Proper CORS credential handling

### 4. Security Headers
- **X-Content-Type-Options:** Prevents MIME sniffing
- **X-Frame-Options:** Prevents clickjacking
- **X-XSS-Protection:** Enables XSS protection
- **Referrer-Policy:** Controls referrer information leakage

### 5. Request Validation
- **Data Type Validation:** Ensures correct data types
- **Range Validation:** Ensures values are within acceptable ranges
- **Required Field Validation:** Ensures required fields are present
- **Format Validation:** Ensures proper format (E.164 phone numbers, etc.)

### 6. Logging & Monitoring
- **Request Logging:** Logs all requests with timing information
- **Error Logging:** Captures and logs server errors
- **IP Tracking:** Logs IP addresses for security monitoring

### 7. Token-Based Authentication
- **JWT Validation:** Validates JWT tokens for protected endpoints
- **Token Requirements:** Requires authorization headers for sensitive operations
- **Token Generation:** Uses secure random secret for token generation

## API Endpoints

### Alert Service (Port 8787)
- `GET /api/health` - Health check (public)
- `POST /api/notify/risk` - Send risk alerts (rate-limited, validated)

### Community API (Port 8788)
- `GET /api/community/health` - Health check (public)
- `GET /api/community/posts` - Get community posts (public)
- `POST /api/community/posts` - Create post (requires token)
- `POST /api/community/posts/:id/like` - Like post (requires token)
- `POST /api/community/posts/:id/comment` - Comment on post (requires token)
- `POST /api/community/connect` - Connect with member (requires token)
- `POST /api/community/scores` - Share score (requires token)
- `GET /api/community/scores` - Get shared scores (public)
- `POST /api/community/report` - Report content (requires token)
- `POST /api/community/block` - Block user (requires token)

## Deployment Security

### Vercel Environment Variables
Add these to your Vercel project settings:

**For Alert Service:**
- `TWILIO_ACCOUNT_SID`
- `TWILIO_AUTH_TOKEN`
- `TWILIO_SMS_FROM`
- `TWILIO_WHATSAPP_FROM`
- `ALLOWED_ORIGINS`
- `DRY_RUN`
- `DEDUPE_WINDOW_MINUTES`

**For Community API:**
- `JWT_SECRET`
- `ALLOWED_ORIGINS`
- `NODE_ENV`

### Production Best Practices
1. **Never commit .env files** - They contain sensitive credentials
2. **Use strong JWT secrets** - At least 32 characters, randomly generated
3. **Rotate credentials regularly** - Update API keys and secrets periodically
4. **Monitor logs** - Set up logging aggregation and monitoring
5. **Use HTTPS** - Always use HTTPS in production
6. **Keep dependencies updated** - Regularly update npm packages
7. **Implement proper authentication** - Use JWT or OAuth for user authentication
8. **Rate limit by user** - Implement user-based rate limiting in addition to IP-based
9. **Validate all inputs** - Never trust client-side validation
10. **Sanitize all outputs** - Prevent XSS through proper output encoding

## Testing Security

### Test Rate Limiting
```bash
# This should work
curl -X POST http://localhost:8787/api/notify/risk -H "Content-Type: application/json" -d '{"patient":{"name":"Test","phone":"+14155551234"},"doctor":{"name":"Test","phone":"+14155551234"},"risk":{"score":50,"band":"moderate"}}'

# This should get rate limited after many requests
for i in {1..150}; do curl -X POST http://localhost:8787/api/notify/risk -H "Content-Type: application/json" -d '{"patient":{"name":"Test","phone":"+14155551234"},"doctor":{"name":"Test","phone":"+14155551234"},"risk":{"score":50,"band":"moderate"}}'; done
```

### Test Input Validation
```bash
# This should fail validation
curl -X POST http://localhost:8787/api/notify/risk -H "Content-Type: application/json" -d '{"patient":{"name":"<script>alert(1)</script>","phone":"invalid"},"doctor":{"name":"Test","phone":"+14155551234"},"risk":{"score":"invalid","band":"moderate"}}'
```

### Test CORS
```bash
# This should fail if origin is not whitelisted
curl -X POST http://localhost:8787/api/notify/risk -H "Origin: http://malicious-site.com" -H "Content-Type: application/json" -d '{"patient":{"name":"Test","phone":"+14155551234"},"doctor":{"name":"Test","phone":"+14155551234"},"risk":{"score":50,"band":"moderate"}}'
```

## Monitoring & Alerts

Set up monitoring for:
- Unusual request patterns
- High error rates
- Rate limit violations
- Failed authentication attempts
- Suspicious input patterns

## Compliance

This security implementation follows:
- **OWASP Top 10** security best practices
- **HIPAA** guidelines for healthcare data protection
- **GDPR** data protection principles
- **SOC 2** security controls
