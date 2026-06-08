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
  Express + PostgreSQL                /dashboard/*
  deployed on Vercel                  deployed on Vercel
        │
        │  Android polls every 5 seconds
        ▼
  Android Phone (SMSGate app)
        │  Reports SIM cards, picks up pending messages
        ▼
  Recipient ✓ SMS delivered
```

---

## Features

- **REST API** — POST to send, GET to check delivery status
- **Multi-tenant** — each account fully isolated; build your own SMS service
- **SIM card selection** — choose SIM 1 or SIM 2 per message
- **Delivery receipts** — track every message: Pending → Sent → Delivered
- **AES-256-CBC encryption** — optional end-to-end encrypted messages
- **Dashboard** — web UI for sending, monitoring, devices, API keys, billing
- **Foreground service** — survives Android background kills
- **Auto-start on reboot** — gateway restarts automatically after phone reboots
- **Multi-device** — connect multiple phones per account
- **Incoming SMS logging** — received messages stored and forwarded

---

## Live Deployment

| Component | URL |
|-----------|-----|
| API server | https://sms-gate-app.vercel.app |
| Dashboard | https://sms-gate-app-t3ay.vercel.app |

Both are live on Vercel — same GitHub repo, two separate Vercel projects (different root directories).

---

## Deploy to Vercel

The server and dashboard are two separate Vercel projects from the same repo, both on Vercel free tier with a Neon PostgreSQL database.

### Step 1 — Database (Neon)

1. Create a free account at [neon.tech](https://neon.tech)
2. Create a new project → copy the **Connection string** (it looks like `postgresql://user:pass@host/db?sslmode=require`)
3. Run the migration once from your local machine:

```bash
cd server
cp .env.example .env
# paste your DATABASE_URL and JWT_SECRET into .env
npm install
npm run db:migrate
```

### Step 2 — Deploy the API server

1. Push this repo to GitHub
2. Go to [vercel.com](https://vercel.com) → **Add New Project** → import your repo
3. Set **Root Directory** to `server`
4. Add these **Environment Variables** in Vercel project settings:

| Variable | Value |
|---|---|
| `DATABASE_URL` | Your Neon connection string |
| `JWT_SECRET` | A long random string (`openssl rand -hex 32`) |
| `PAYSTACK_SECRET_KEY` | From your Paystack dashboard (optional) |
| `APP_URL` | Your server Vercel URL (e.g. `https://sms-gate-app.vercel.app`) |
| `DASHBOARD_URL` | Your dashboard Vercel URL |

5. Deploy — Vercel will auto-build with `server/vercel.json`
6. Note your server URL (e.g. `https://sms-gate-app.vercel.app`)

### Step 3 — Deploy the dashboard

1. Go to Vercel → **Add New Project** → import the same repo again
2. Set **Root Directory** to `dashboard`
3. Add this **Environment Variable**:

| Variable | Value |
|---|---|
| `NEXT_PUBLIC_API_URL` | Your server URL from Step 2 (no trailing slash) |

4. Deploy — Vercel auto-detects Next.js
5. Open https://sms-gate-app-t3ay.vercel.app → register your account

### Step 4 — Install the Android app

Build the APK from source:

```powershell
# Windows — from repo root
$env:ANDROID_HOME = "C:\Users\YOU\AppData\Local\Android\Sdk"
cd android
.\gradlew.bat assembleDebug -x test
```

Or grab the pre-built APK from [Releases](https://github.com/t-boye/SMSGate-App/releases).

Install on phone:
```powershell
adb install -r "app\build\outputs\apk\debug\app-debug.apk"
```

### Step 5 — Connect your phone

1. Open the SMSGate app
2. Go to **Settings → Cloud Server**
3. Enable Cloud Mode
4. Enter your **Server URL** (from Step 2)
5. Enter the **Login** and **Password** you set in the dashboard → Devices
6. Your device appears as **Online** in the dashboard

### Step 6 — Send your first SMS

```bash
# 1. In the dashboard → API Keys → create a key
# 2. Send:
curl -X POST https://sms-gate-app.vercel.app/api/v1/messages \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"message":"Hello from SMSGate!","phoneNumbers":["+233244123456"]}'
```

Response:
```json
{ "id": "uuid", "status": "queued" }
```

The phone picks it up within 5 seconds and SMS is sent.

---

## REST API Reference

**Base URL:** `https://sms-gate-app.vercel.app`

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

### Send SMS — Request body

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
| `Pending` | Queued — waiting for a device to pick it up |
| `Processed` | Device claimed it and is sending |
| `Sent` | Handed off to the carrier |
| `Delivered` | Carrier confirmed delivery |
| `Failed` | Could not be sent |

---

## Code Examples

### JavaScript / Node.js

```javascript
const res = await fetch('https://sms-gate-app.vercel.app/api/v1/messages', {
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
    'https://sms-gate-app.vercel.app/api/v1/messages',
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
$ch = curl_init('https://sms-gate-app.vercel.app/api/v1/messages');
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

## Local Development

### Server

```bash
cd server
cp .env.example .env   # fill in DATABASE_URL, JWT_SECRET
npm install
npm run db:migrate     # run once
npm run dev            # http://localhost:3000
```

### Dashboard

```bash
cd dashboard
# create .env.local with:
# NEXT_PUBLIC_API_URL=http://localhost:3000
npm install
npm run dev            # http://localhost:3001
```

### Android app

```bash
npm install            # from repo root
npm start              # Metro bundler
npm run android        # build & run on device
```

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
| Relay server | Express.js + PostgreSQL (Neon) |
| Dashboard | Next.js 16 (App Router, Turbopack), Tailwind CSS |
| Hosting | Vercel (server + dashboard) |
| Encryption | AES-256-CBC via crypto-js |
| Billing | Paystack |
