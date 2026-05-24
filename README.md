# SMSGate

Turn your Android phone into a self-hosted SMS gateway. Send SMS from any app via a simple REST API — no Twilio, no monthly bills.

**Live relay:** [sms-gate-app.vercel.app](https://sms-gate-app.vercel.app)

---

## How It Works

```
Your App / Backend
        │
        │  POST /api/v1/messages
        ▼
  Cloud Relay Server          ← hosted on Vercel (free)
  sms-gate-app.vercel.app
        │
        │  phone polls every 5 seconds
        ▼
  Android Phone (your device)
        │
        │  SmsManager API
        ▼
  Recipient's phone  ✓ SMS delivered
```

Your Android phone acts as the SMS bridge. It needs mobile data or WiFi to poll the relay, and an active SIM to send messages.

---

## Quick Start

### 1. Install the App

Visit **[sms-gate-app.vercel.app](https://sms-gate-app.vercel.app)** on your Android phone and tap **Download APK**, or scan the QR code.

After installing:
- Open the app
- Grant SMS + notification permissions when prompted

### 2. Create an Account

In the app → **Settings → Cloud Server**:
- Enable **Cloud Mode**: ON
- Server URL is pre-filled: `https://sms-gate-app.vercel.app`
- Tap **"No account yet? Create one"**
- Fill in: Display Name, Username, Password → tap **Create Account**
- Tap **Save Settings**

The app now polls the relay every 5 seconds automatically.

### 3. Get an API Key

Contact the server admin to get a Bearer API key, or if you're self-hosting, create one via the admin endpoint:

```bash
curl -X POST https://your-relay.vercel.app/api/v1/keys \
  -H "Authorization: Bearer YOUR_ADMIN_KEY" \
  -H "Content-Type: application/json" \
  -d '{"name":"my-app"}'
```

Response:
```json
{ "key": "abc123...", "name": "my-app" }
```

### 4. Send Your First SMS

```bash
curl -X POST https://sms-gate-app.vercel.app/api/v1/messages \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Hello from SMSGate!",
    "phoneNumbers": ["+233244123456"]
  }'
```

Response:
```json
{ "id": "uuid", "status": "queued" }
```

The phone picks it up within 5 seconds and sends the SMS.

---

## API Reference

**Base URL:** `https://sms-gate-app.vercel.app`

### Authentication

| Auth Type | Used For | Format |
|-----------|----------|--------|
| Bearer API Key | Submitting SMS jobs | `Authorization: Bearer <api_key>` |
| Basic Auth | Device (phone app) auth | `Authorization: Basic base64(login:password)` |
| Admin Key | Managing devices & keys | `Authorization: Bearer <admin_key>` |

### Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `POST` | `/api/v1/messages` | API Key | Submit an SMS job |
| `GET` | `/api/v1/messages` | API Key | List all messages |
| `GET` | `/api/v1/messages/:id` | API Key | Get message + delivery status |
| `POST` | `/api/v1/auth/register` | None | Register a device account |
| `GET` | `/health` | None | Server health check |

### Send SMS — Request Body

```json
{
  "message": "Your OTP is 1234",
  "phoneNumbers": ["+233244123456", "+233201234567"],
  "simNumber": 1
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `message` | string | Yes | SMS text content |
| `phoneNumbers` | string[] | Yes | E.164 format (`+countrycode...`) |
| `simNumber` | number | No | SIM slot: `1` or `2` (default: `1`) |

### Message States

| State | Meaning |
|-------|---------|
| `Pending` | Queued, waiting for phone to poll |
| `Processed` | Phone claimed the job |
| `Sent` | SMS dispatched from phone |
| `Delivered` | Carrier confirmed delivery |
| `Failed` | SMS failed to send |

---

## Code Examples

### JavaScript / Node.js

```javascript
async function sendSMS(phone, message) {
  const res = await fetch('https://sms-gate-app.vercel.app/api/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer YOUR_API_KEY'
    },
    body: JSON.stringify({ message, phoneNumbers: [phone] })
  });
  const data = await res.json();
  return data.id; // use to check status later
}

// Send OTP
await sendSMS('+233244123456', 'Your verification code is 8472');
```

### Python

```python
import requests

def send_sms(phone, message):
    r = requests.post(
        'https://sms-gate-app.vercel.app/api/v1/messages',
        headers={
            'Authorization': 'Bearer YOUR_API_KEY',
            'Content-Type': 'application/json'
        },
        json={'message': message, 'phoneNumbers': [phone]}
    )
    r.raise_for_status()
    return r.json()['id']

send_sms('+233244123456', 'Your order has been confirmed.')
```

### PHP

```php
function sendSMS($phone, $message) {
    $ch = curl_init('https://sms-gate-app.vercel.app/api/v1/messages');
    curl_setopt_array($ch, [
        CURLOPT_POST => true,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_HTTPHEADER => [
            'Content-Type: application/json',
            'Authorization: Bearer YOUR_API_KEY'
        ],
        CURLOPT_POSTFIELDS => json_encode([
            'message'      => $message,
            'phoneNumbers' => [$phone]
        ])
    ]);
    $res = curl_exec($ch);
    curl_close($ch);
    return json_decode($res, true)['id'];
}

sendSMS('+233244123456', 'Payment received. Thank you!');
```

### Check Delivery Status

```javascript
const status = await fetch(
  `https://sms-gate-app.vercel.app/api/v1/messages/${messageId}`,
  { headers: { 'Authorization': 'Bearer YOUR_API_KEY' } }
).then(r => r.json());

console.log(status.state); // "Sent", "Delivered", "Failed"
```

---

## Features

- **Cloud mode** — phone polls relay, works behind any NAT/firewall
- **Local HTTP server** — direct REST API on Wi-Fi (no internet needed)
- **Multi-SIM** — choose which SIM slot to send from
- **Delivery tracking** — carrier receipts reported back to relay
- **Webhooks** — HTTP POST on `sms:sent`, `sms:delivered`, `sms:received`, `sms:failed`
- **AES-256-CBC encryption** — optional end-to-end encryption
- **Incoming SMS logging** — received messages stored and forwarded
- **Foreground service** — survives Android background kills
- **Auto-start on reboot** — gateway back up automatically after phone restarts

---

## Self-Hosting the Relay Server

You can host your own relay instead of using `sms-gate-app.vercel.app`.

### Requirements
- Vercel account (free tier works)
- Neon database (free tier: [neon.tech](https://neon.tech))

### Deploy

```bash
git clone https://github.com/t-boye/SMSGate-App
cd SMSGate-App/server
cp .env.example .env
```

Edit `.env`:
```env
DATABASE_URL=postgresql://...   # your Neon connection string
ADMIN_KEY=choose-a-strong-secret-key
```

```bash
npm install
npm run db:migrate    # creates tables (run once)
vercel deploy --prod
```

Point the Android app's **Server URL** to your new deployment.

### Admin Operations

```bash
# Create an API key for a client app
curl -X POST https://your-relay.vercel.app/api/v1/keys \
  -H "Authorization: Bearer YOUR_ADMIN_KEY" \
  -d '{"name":"my-app"}'

# List registered devices
curl https://your-relay.vercel.app/api/v1/devices \
  -H "Authorization: Bearer YOUR_ADMIN_KEY"
```

---

## Releasing a New APK

Tag a release to trigger GitHub Actions:

```bash
git tag v1.0.5
git push origin v1.0.5
```

The workflow builds the APK and publishes it to GitHub Releases. The landing page at your relay URL always links to the latest release.

---

## Requirements

| Item | Requirement |
|------|-------------|
| Android version | 7.0+ (API 24+) |
| Permissions | SMS, Receive SMS, Read Phone State, Notifications |
| Network | Mobile data or WiFi (for cloud polling) |
| SIM | Active SIM with SMS capability |

---

## Stack

| Layer | Technology |
|-------|-----------|
| Android app | React Native 0.84 + Kotlin |
| SMS engine | Android SmsManager |
| Local server | NanoHTTPD (embedded HTTP) |
| Message storage | AsyncStorage (in-memory + persisted) |
| Relay server | Express.js + Neon (Postgres) on Vercel |
| Encryption | AES-256-CBC via crypto-js |
