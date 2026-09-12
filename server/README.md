# ARDS Alert Service

Sends at-risk rehabilitation alerts over Twilio: a short **SMS** and a detailed
**WhatsApp** message to both the patient and the treating clinician.

The dashboard is a static site, so it cannot hold Twilio credentials. It posts
the risk assessment to this service, which composes and delivers the messages.

## Run locally

```bash
cd server
npm install
cp .env.example .env    # fill in your Twilio values
npm start               # http://localhost:8787
```

Without Twilio credentials the service starts in **dry-run** mode: messages are
composed and logged to the console instead of being sent.

In the dashboard, open **Alerts → At-Risk SMS & WhatsApp Notifications**, set the
alert service URL, the patient and clinician mobile numbers (E.164, e.g.
`+14155551234`), and use **Test service** to confirm connectivity.

## Configuration

| Variable | Purpose |
| --- | --- |
| `TWILIO_ACCOUNT_SID` / `TWILIO_AUTH_TOKEN` | Twilio API credentials |
| `TWILIO_SMS_FROM` | SMS-capable Twilio number, E.164 |
| `TWILIO_WHATSAPP_FROM` | WhatsApp sender, e.g. `whatsapp:+14155238886` |
| `PORT` | Listen port (default `8787`) |
| `ALLOWED_ORIGINS` | Comma-separated CORS origins, `*` for any |
| `DRY_RUN` | `true` logs messages instead of sending |
| `DEDUPE_WINDOW_MINUTES` | Suppresses repeat alerts for the same patient/session |

With the Twilio WhatsApp sandbox, each recipient must first join the sandbox by
sending the join code to the sandbox number.

## API

### `GET /api/health`

```json
{ "status": "ok", "dryRun": false, "credentialsPresent": true,
  "smsFrom": "+1...", "whatsappFrom": "whatsapp:+1..." }
```

### `POST /api/notify/risk`

```json
{
  "patient": { "id": "P002", "name": "Elena Rostova", "phone": "+14155551234" },
  "doctor":  { "name": "Dr. Samuel Vance, CPO", "phone": "+14155559876" },
  "risk": {
    "score": 38.4, "band": "Poor", "state": "UNSTABLE", "severity": "critical",
    "safetyFlag": "HIGH_FATIGUE", "reasons": ["Fatigue index 72% exceeds the 55% threshold."],
    "recommendation": "Reduce training difficulty by 15%.",
    "sessionNumber": 5, "date": "2026-08-02"
  }
}
```

Responds with `sent`, `partial`, `dry-run`, or `duplicate`, plus a per-channel
result list and the composed message bodies. Invalid payloads return `400`.

## Tests

```bash
npm test
```
