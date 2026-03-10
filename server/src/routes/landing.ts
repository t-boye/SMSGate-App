import { Router, Request, Response } from 'express';

const router = Router();

const APK_URL = 'https://github.com/t-boye/SMSGate-App/releases/latest/download/smsgate.apk';

router.get(/^\/$/, (_req: Request, res: Response) => {
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>SMSGate</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    :root {
      --bg:      #0A0E1A;
      --surface: #111827;
      --border:  #1E2D45;
      --gold:    #C9A84C;
      --text:    #F1F5F9;
      --muted:   #64748B;
    }

    html, body {
      height: 100%;
    }

    body {
      background: var(--bg);
      color: var(--text);
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif;
      -webkit-font-smoothing: antialiased;
    }

    /* ── Layout ── */
    .page {
      max-width: 560px;
      margin: 0 auto;
      padding: 80px 24px 100px;
    }

    /* ── Header ── */
    .wordmark {
      font-size: 13px;
      font-weight: 700;
      letter-spacing: 0.18em;
      text-transform: uppercase;
      color: var(--gold);
      margin-bottom: 56px;
    }

    .headline {
      font-size: clamp(32px, 6vw, 48px);
      font-weight: 700;
      line-height: 1.15;
      letter-spacing: -0.03em;
      color: var(--text);
    }

    .sub {
      margin-top: 16px;
      font-size: 16px;
      line-height: 1.7;
      color: var(--muted);
      max-width: 420px;
    }

    /* ── Primary button ── */
    .btn-primary {
      display: block;
      margin-top: 40px;
      background: var(--gold);
      color: var(--bg);
      font-size: 14px;
      font-weight: 700;
      letter-spacing: 0.04em;
      text-transform: uppercase;
      text-decoration: none;
      padding: 15px 32px;
      border-radius: 4px;
      width: fit-content;
      transition: opacity 0.15s;
    }

    .btn-primary:hover { opacity: 0.85; }

    /* ── URL row ── */
    .url-row {
      display: flex;
      align-items: center;
      gap: 0;
      margin-top: 14px;
      border: 1px solid var(--border);
      border-radius: 4px;
      overflow: hidden;
      background: var(--surface);
    }

    .url-text {
      flex: 1;
      padding: 11px 14px;
      font-family: 'SFMono-Regular', 'Consolas', monospace;
      font-size: 12px;
      color: var(--muted);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .copy-btn {
      padding: 11px 16px;
      background: transparent;
      border: none;
      border-left: 1px solid var(--border);
      color: var(--gold);
      font-size: 12px;
      font-weight: 600;
      letter-spacing: 0.04em;
      cursor: pointer;
      white-space: nowrap;
      transition: background 0.15s;
    }

    .copy-btn:hover { background: rgba(201,168,76,0.08); }
    .copy-btn.done  { color: #4ade80; border-left-color: var(--border); }

    /* ── Divider ── */
    .rule {
      border: none;
      border-top: 1px solid var(--border);
      margin: 56px 0;
    }

    /* ── Section label ── */
    .label {
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.14em;
      text-transform: uppercase;
      color: var(--muted);
      margin-bottom: 24px;
    }

    /* ── Steps ── */
    .steps {
      display: flex;
      flex-direction: column;
      gap: 0;
    }

    .step {
      display: flex;
      gap: 20px;
      padding: 20px 0;
      border-bottom: 1px solid var(--border);
    }

    .step:last-child { border-bottom: none; }

    .step-n {
      font-size: 12px;
      font-weight: 700;
      color: var(--gold);
      width: 20px;
      flex-shrink: 0;
      padding-top: 2px;
    }

    .step-body {
      font-size: 14px;
      line-height: 1.6;
      color: var(--muted);
    }

    .step-body strong { color: var(--text); font-weight: 600; }

    /* ── QR ── */
    .qr-wrap {
      margin-top: 32px;
      display: flex;
      align-items: flex-start;
      gap: 20px;
    }

    .qr-img {
      background: #fff;
      border-radius: 4px;
      padding: 8px;
      flex-shrink: 0;
    }

    .qr-img img { display: block; width: 96px; height: 96px; }

    .qr-note {
      padding-top: 4px;
      font-size: 13px;
      line-height: 1.6;
      color: var(--muted);
    }

    .qr-note strong { color: var(--text); font-weight: 600; display: block; margin-bottom: 4px; }

    /* ── API table ── */
    .api-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 13px;
    }

    .api-table tr { border-bottom: 1px solid var(--border); }
    .api-table tr:last-child { border-bottom: none; }

    .api-table td {
      padding: 12px 0;
      vertical-align: top;
    }

    .api-table td:first-child { width: 52px; padding-right: 12px; }
    .api-table td:nth-child(2) { padding-right: 16px; white-space: nowrap; }

    .m {
      display: inline-block;
      font-family: monospace;
      font-size: 10px;
      font-weight: 700;
      padding: 2px 5px;
      border-radius: 2px;
      letter-spacing: 0.04em;
    }

    .m-post { background: rgba(201,168,76,0.12); color: var(--gold); }
    .m-get  { background: rgba(201,168,76,0.06); color: rgba(201,168,76,0.7); }

    .api-path { font-family: monospace; font-size: 12px; color: var(--text); }
    .api-desc { color: var(--muted); font-size: 12px; }

    /* ── Footer ── */
    footer {
      margin-top: 80px;
      padding-top: 24px;
      border-top: 1px solid var(--border);
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 8px;
    }

    footer span { font-size: 12px; color: var(--muted); }
    footer a    { font-size: 12px; color: var(--gold); text-decoration: none; letter-spacing: 0.02em; }
    footer a:hover { text-decoration: underline; }
  </style>
</head>
<body>
<div class="page">

  <!-- Wordmark -->
  <div class="wordmark">SMSGate</div>

  <!-- Hero -->
  <h1 class="headline">Your phone.<br>Your SMS gateway.</h1>
  <p class="sub">Install the app on any Android phone and route SMS from all your apps through it — self-hosted, no third-party services.</p>

  <!-- Download -->
  <a class="btn-primary" href="${APK_URL}">Download APK</a>

  <!-- Copyable URL -->
  <div class="url-row">
    <span class="url-text" id="apkUrl">${APK_URL}</span>
    <button class="copy-btn" id="copyBtn" onclick="copyUrl()">Copy</button>
  </div>

  <hr class="rule" />

  <!-- Install steps -->
  <p class="label">Installation</p>
  <div class="steps">
    <div class="step">
      <span class="step-n">01</span>
      <p class="step-body">Open this page in <strong>Chrome on your Android phone</strong>. Tap <strong>Download APK</strong> and allow the download when prompted.</p>
    </div>
    <div class="step">
      <span class="step-n">02</span>
      <p class="step-body">Open the downloaded file from your notifications. If asked, enable <strong>Install from unknown sources</strong> for Chrome, then tap Install.</p>
    </div>
    <div class="step">
      <span class="step-n">03</span>
      <p class="step-body">Open <strong>SMSGate</strong> and grant SMS permissions. Go to <strong>Settings → Cloud Server</strong>, create an account, and tap Save.</p>
    </div>
  </div>

  <!-- QR -->
  <div class="qr-wrap">
    <div class="qr-img">
      <img
        src="https://api.qrserver.com/v1/create-qr-code/?size=96x96&data=${encodeURIComponent(APK_URL)}&bgcolor=ffffff&color=0A0E1A&margin=0"
        alt="QR code"
      />
    </div>
    <p class="qr-note">
      <strong>Scan to download</strong>
      Point your phone camera at the QR code to open the download link directly on your device.
    </p>
  </div>

  <hr class="rule" />

  <!-- API reference -->
  <p class="label">API Reference</p>
  <table class="api-table">
    <tr>
      <td><span class="m m-post">POST</span></td>
      <td><span class="api-path">/api/v1/messages</span></td>
      <td class="api-desc">Submit an SMS job — requires Bearer API key</td>
    </tr>
    <tr>
      <td><span class="m m-get">GET</span></td>
      <td><span class="api-path">/api/v1/messages</span></td>
      <td class="api-desc">List messages with pagination</td>
    </tr>
    <tr>
      <td><span class="m m-get">GET</span></td>
      <td><span class="api-path">/api/v1/messages/:id</span></td>
      <td class="api-desc">Get message and delivery status</td>
    </tr>
    <tr>
      <td><span class="m m-post">POST</span></td>
      <td><span class="api-path">/api/v1/auth/register</span></td>
      <td class="api-desc">Register a new device account</td>
    </tr>
    <tr>
      <td><span class="m m-get">GET</span></td>
      <td><span class="api-path">/health</span></td>
      <td class="api-desc">Server and database health check</td>
    </tr>
  </table>

  <!-- Footer -->
  <footer>
    <span>Self-hosted &middot; Your data, your server</span>
    <a href="https://github.com/t-boye/SMSGate-App" target="_blank">GitHub</a>
  </footer>

</div>

<script>
  function copyUrl() {
    const url = document.getElementById('apkUrl').textContent.trim();
    navigator.clipboard.writeText(url).then(() => {
      const btn = document.getElementById('copyBtn');
      btn.textContent = 'Copied';
      btn.classList.add('done');
      setTimeout(() => {
        btn.textContent = 'Copy';
        btn.classList.remove('done');
      }, 2000);
    });
  }
</script>
</body>
</html>`);
});

export default router;
