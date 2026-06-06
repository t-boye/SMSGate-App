# SMSGate

Turn any Android phone into a self-hosted, programmable SMS gateway. Send SMS from any backend via a simple REST API — no Twilio, no monthly carrier fees.

---

## Architecture

```
Your App / Backend
        │
        │  POST /api/v1/messages  (Bearer API key)
        ▼
  Relay Server  ─────────────────── Dashboard (Next.js)
  Express + PostgreSQL                /dashboard/send
        │
        │  Android polls every 5 seconds
        ▼
  Android Phone (your device)
        │  SMSGate app running as foreground service
        │  Reports SIM cards, picks up pending messages
        ▼
  Recipient ✓ SMS delivered
```

---

## Features

- **REST API** — POST to send, GET to check delivery status
- **Multi-tenant** — each account fully isolated; build your own service
- **SIM card selection** — choose SIM 1 or SIM 2 per message
- **Delivery receipts** — track every message: Pending → Sent → Delivered
- **AES-256-CBC encryption** — optional end-to-end encrypted messages
- **Dashboard** — web UI for sending, monitoring, devices, API keys, billing
- **Foreground service** — survives Android background kills
- **Auto-start on reboot** — gateway restarts automatically after phone reboots
- **Multi-device** — connect multiple phones per account
- **Incoming SMS logging** — received messages stored and forwarded

---

## Quick Start

### 1. Set up the server

```bash
git clone https://github.com/t-boye/SMSGate-App
cd SMSGate-App/server
cp .env.example .env
```

Edit `.env`:
```env
DATABASE_URL=postgresql://...   # Neon or any Postgres
JWT_SECRET=change-this-to-a-long-random-string
PAYSTACK_SECRET_KEY=sk_...      # optional — for billing
```

```bash
npm install
npm run db:migrate              # creates tables (run once)
npm run dev                     # development
npm start                       # production (after npm run build)
```

### 2. Set up the dashboard

```bash
cd SMSGate-App/dashboard
cp .env.local.example .env.local  # or create manually
```

`.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:3000   # your server URL
```

```bash
npm install
npm run dev     # http://localhost:3001
```

### 3. Install the Android app

Build the APK:
```powershell
# Windows — from SMSGate-App directory
$env:ANDROID_HOME = "C:\Users\YOU\AppData\Local\Android\Sdk"
cd android
.\gradlew.bat assembleDebug -x test
```

Install on phone:
```powershell
adb install -r "app\build\outputs\apk\debug\app-debug.apk"
```

Open the app → **Settings → Cloud Server**:
- Enable Cloud Mode
- Enter your server URL and device credentials from the dashboard

### 4. Send your first SMS

```bash
# 1. Get a device token from Settings → Cloud Server in the app
# 2. Log in to the dashboard and create an API key
# 3. Send:

curl -X POST https://your-server.com/api/v1/messages \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"message":"Hello from SMSGate!","phoneNumbers":["+233244123456"]}'
```

Response:
```json
{ "id": "uuid", "status": "queued" }
```

The phone picks it up within 5 seconds.

---

## REST API Reference

**Base URL:** `https://your-server.com`

### Authentication

All API requests require a Bearer token:
```
Authorization: Bearer YOUR_API_KEY
```
Get your API key from the **API Keys** section in the dashboard.

### Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/v1/messages` | Send an SMS |
| `GET`  | `/api/v1/messages` | List messages (last 50) |
| `GET`  | `/api/v1/messages/:id` | Get message + delivery status |
| `GET`  | `/api/v1/devices` | List your devices and SIM cards |
| `GET`  | `/health` | Server health check |

### Send SMS — Request

```json
{
  "message": "Your OTP is 1234",
  "phoneNumbers": ["+233244123456", "+233201234567"],
  "simNumber": 1,
  "deviceId": "optional-device-uuid"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `message` | string | Yes | SMS text |
| `phoneNumbers` | string[] | Yes | E.164 format (`+countrycode...`) |
| `simNumber` | number | No | SIM slot: `1` or `2` (default: primary SIM) |
| `deviceId` | string | No | Route to a specific device |

### Message States

| State | Meaning |
|-------|---------|
| `Pending` | Queued — waiting for a device to poll |
| `Processed` | Device claimed it and is sending |
| `Sent` | Handed off to the carrier |
| `Delivered` | Carrier confirmed delivery |
| `Failed` | Could not be sent |

---

## Code Examples

### JavaScript / Node.js

```javascript
const res = await fetch('https://your-server.com/api/v1/messages', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer YOUR_API_KEY',
  },
  body: JSON.stringify({
    message: 'Your verification code is 8472',
    phoneNumbers: ['+233244123456'],
    simNumber: 1,
  }),
});
const { id } = await res.json();
```

### Python

```python
import requests

r = requests.post(
    'https://your-server.com/api/v1/messages',
    headers={'Authorization': 'Bearer YOUR_API_KEY'},
    json={
        'message': 'Your order has been confirmed.',
        'phoneNumbers': ['+233244123456'],
    }
)
print(r.json()['id'])
```

### PHP

```php
$ch = curl_init('https://your-server.com/api/v1/messages');
curl_setopt_array($ch, [
    CURLOPT_POST => true,
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_HTTPHEADER => [
        'Content-Type: application/json',
        'Authorization: Bearer YOUR_API_KEY',
    ],
    CURLOPT_POSTFIELDS => json_encode([
        'message'      => 'Payment received.',
        'phoneNumbers' => ['+233244123456'],
    ]),
]);
echo curl_exec($ch);
```

---

## Dashboard Pages

| Page | Description |
|------|-------------|
| `/dashboard` | Overview — usage stats, quick start |
| `/dashboard/send` | Send SMS from the web UI with SIM selection |
| `/dashboard/devices` | Manage Android devices |
| `/dashboard/keys` | Create and manage API keys |
| `/dashboard/messages` | Message log with delivery status |
| `/dashboard/billing` | Plans and Paystack payment |
| `/dashboard/docs` | Full API reference |
| `/dashboard/settings` | Profile, password, plan limits |

---

## Plans

| Plan | SMS/month | Devices | API Keys |
|------|-----------|---------|----------|
| Free | 100 | 1 | 1 |
| Basic | 5,000 | 3 | 5 |
| Pro | 30,000 | 10 | ∞ |
| Business | ∞ | ∞ | ∞ |

Payments via Paystack (GHS).

---

## Requirements

| Item | Requirement |
|------|-------------|
| Android | 7.0+ (API 24+) |
| Permissions | SMS, Receive SMS, Read Phone State, Notifications |
| Network | Mobile data or WiFi |
| SIM | Active SIM with SMS capability |

---

## Stack

| Layer | Technology |
|-------|-----------|
| Android app | React Native 0.84, TypeScript, Old Architecture |
| SMS engine | Android SmsManager (Kotlin) |
| Local HTTP server | NanoHTTPD (embedded) |
| SQLite storage | op-sqlite v11 |
| Relay server | Express.js + PostgreSQL (Neon) |
| Dashboard | Next.js 16 (App Router, Turbopack), Tailwind CSS |
| Encryption | AES-256-CBC via crypto-js |
| Billing | Paystack |
