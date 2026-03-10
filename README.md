# SMSGate

Turn your Android phone into a self-hosted SMS gateway. One phone, one SIM — all your apps send SMS through it via a simple HTTP API.

## Install the Android App

**On your phone, open this URL in Chrome:**

```
https://sms-gate-app.vercel.app
```

Tap **Download APK** → install → open → grant permissions → configure.

Or scan the QR code on that page.

---

## How it works

```
Your Apps  ──→  Gateway Backend (existing)
                      ↓  queues job
               sms-gate-app.vercel.app  (relay — this repo's server/)
                      ↓  Android polls every 5s
               Android Phone  →  SIM  →  Customer
```

---

## Project Structure

```
SMSGate-App/
  android/                    ← Native Android project (Kotlin)
    app/src/main/java/com/smsgateapp/
      sms/                    ← SmsSenderModule, SmsReceiverModule
      server/                 ← NanoHTTPD HTTP server (port 8080)
      service/                ← Foreground service (keeps app alive)
      boot/                   ← Auto-start on phone reboot
  src/                        ← React Native app (TypeScript)
    screens/                  ← Home, Messages, Settings
    modules/
      cloud/CloudClient.ts    ← Polls relay server every 5s
      server/HttpServer.ts    ← Local HTTP server bridge
      sms/SmsSender.ts        ← Sends SMS via native module
      storage/MessageStore.ts ← SQLite message log (op-sqlite)
      crypto/Encryption.ts    ← AES-256-CBC via crypto-js
      webhook/                ← HTTP POST notifications
  server/                     ← Self-hosted relay (Vercel + Neon)
    src/
      routes/
        landing.ts            ← Install page (sms-gate-app.vercel.app)
        messages.ts           ← /api/v1/messages (submit + poll + status)
        auth.ts               ← /api/v1/auth/register (self-register)
        devices.ts            ← /api/v1/devices (admin)
        health.ts             ← /health
      database.ts             ← Neon (Postgres) pool + helpers
      migrate.ts              ← Run once to create tables
  .github/workflows/
    release.yml               ← Auto-build APK on GitHub tag push
```

---

## Relay Server (server/)

Deployed at `https://sms-gate-app.vercel.app`. Powered by Vercel + Neon (Postgres).

### API

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `POST` | `/api/v1/messages` | Bearer API key | Submit an SMS job |
| `GET`  | `/api/v1/messages` | Bearer API key | List messages (`?limit=50&offset=0`) |
| `GET`  | `/api/v1/messages/:id` | Bearer API key | Get message status |
| `PATCH`| `/api/v1/messages/:id` | Device auth | Device reports delivery status |
| `GET`  | `/api/v1/messages/pending` | Device auth | Device claims pending jobs |
| `POST` | `/api/v1/auth/register` | None | Register a new device account |
| `POST` | `/api/v1/devices` | Admin key | Admin: create device |
| `GET`  | `/api/v1/devices` | Admin key | Admin: list devices |
| `POST` | `/api/v1/keys` | Admin key | Admin: create API key |
| `GET`  | `/health` | None | Server health |
| `GET`  | `/` | None | Install landing page |

### Send an SMS

```bash
curl -X POST https://sms-gate-app.vercel.app/api/v1/messages \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"phoneNumbers":["+233244123456"],"message":"Hello!"}'
```

Response:
```json
{ "id": "uuid", "status": "queued" }
```

---

## Device Setup (Android App)

1. Install APK from `https://sms-gate-app.vercel.app`
2. Grant SMS + notification permissions
3. **Settings → Cloud Server**
   - Enable Cloud Mode: ON
   - Server URL: `https://sms-gate-app.vercel.app`
   - Tap **"No account yet? Create one"** — fill Name, Username, Password → Create
   - Tap **Save Settings**
4. The app now polls the relay every 5 seconds for jobs

---

## Local Development

### Android App
```bash
npm install
npm start          # Metro bundler
npm run android    # Build + run on connected device
```

### Relay Server
```bash
cd server
cp .env.example .env   # fill in DATABASE_URL and ADMIN_KEY
npm install
npm run db:migrate     # create Neon tables (run once)
npm run dev            # start dev server on port 3000
```

---

## Releasing a New APK

### One-time setup (GitHub Secrets)

Generate a release keystore:
```bash
keytool -genkeypair -v \
  -keystore release.keystore \
  -alias smsgate \
  -keyalg RSA -keysize 2048 \
  -validity 10000
```

Base64-encode it:
```bash
base64 -i release.keystore | pbcopy   # macOS
base64 release.keystore | xclip       # Linux
```

Add these secrets to your GitHub repo (**Settings → Secrets → Actions**):

| Secret | Value |
|--------|-------|
| `KEYSTORE_BASE64` | base64-encoded keystore file |
| `KEYSTORE_PASSWORD` | keystore password |
| `KEY_ALIAS` | key alias (e.g. `smsgate`) |
| `KEY_PASSWORD` | key password |

### Trigger a release

```bash
git tag v1.0.0
git push origin v1.0.0
```

GitHub Actions builds the APK, creates a release, and uploads `smsgate.apk`. The install page at `https://sms-gate-app.vercel.app` always links to the latest release.

---

## Features

- Send SMS via REST API from any app
- Receive incoming SMS — logged and optionally forwarded via webhook
- Cloud mode — phone polls relay server, no port-forwarding needed
- Local HTTP server mode — direct API access on Wi-Fi
- AES-256-CBC message encryption (optional)
- Multi-SIM support
- Delivery tracking
- Foreground service — survives background kills
- Auto-start on device reboot
- Premium dark UI (navy + gold)

---

## Stack

| Layer | Technology |
|-------|-----------|
| Android app | React Native 0.84 + Kotlin native modules |
| SMS sending | Android SmsManager + NanoHTTPD |
| Local storage | op-sqlite (synchronous SQLite) |
| Relay server | Express + Neon (Postgres) on Vercel |
| Encryption | crypto-js AES-256-CBC |
| Settings | AsyncStorage |
