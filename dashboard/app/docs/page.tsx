'use client';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Copy, Check, ChevronDown, ChevronUp,
  ArrowRight, Download, Key, Smartphone, Code2, Globe,
  Activity, BookOpen,
} from 'lucide-react';

const API_BASE = 'https://sms-gate-app.vercel.app';
const APK_URL  = 'https://github.com/t-boye/SMSGate-App/releases/latest/download/smsgate.apk';

const NAV_SECTIONS = [
  { id: 'overview',        label: 'Overview',          group: 'Getting started' },
  { id: 'quickstart',      label: 'Quick Start',        group: 'Getting started' },
  { id: 'send-sms',        label: 'Sending SMS',        group: 'Integration'     },
  { id: 'check-status',    label: 'Delivery Status',    group: 'Integration'     },
  { id: 'code-examples',   label: 'Code Examples',      group: 'Integration'     },
  { id: 'authentication',  label: 'Authentication',     group: 'API Reference'   },
  { id: 'endpoints',       label: 'Endpoints',          group: 'API Reference'   },
  { id: 'message-states',  label: 'Message States',     group: 'API Reference'   },
  { id: 'errors',          label: 'Errors & Limits',    group: 'API Reference'   },
];

const GROUPS = ['Getting started', 'Integration', 'API Reference'];

// ── Sub-components ──────────────────────────────────────────────────────────

function CopyBtn({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  function copy() {
    navigator.clipboard.writeText(text);
    setCopied(true); setTimeout(() => setCopied(false), 2000);
  }
  return (
    <button onClick={copy} title="Copy" style={{
      padding: '4px 6px', borderRadius: 6, background: 'transparent', border: 'none',
      cursor: 'pointer', display: 'flex', color: copied ? '#22c55e' : '#475569',
      transition: 'color 0.15s',
    }}>
      {copied ? <Check size={13} /> : <Copy size={13} />}
    </button>
  );
}

function Code({ code, lang = '' }: { code: string; lang?: string }) {
  return (
    <div style={{ borderRadius: 12, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.08)', marginTop: 10 }}>
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '8px 14px', background: '#0a1220', borderBottom: '1px solid rgba(255,255,255,0.06)',
      }}>
        <span style={{ fontSize: 10, color: '#334155', fontFamily: 'monospace', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{lang}</span>
        <CopyBtn text={code} />
      </div>
      <pre style={{
        margin: 0, padding: '16px 18px',
        fontSize: 12, lineHeight: 1.7, overflowX: 'auto', whiteSpace: 'pre',
        background: '#060b14', color: '#86efac', fontFamily: 'monospace',
      }}>{code.trim()}</pre>
    </div>
  );
}

function Endpoint({ method, path, desc, children }: {
  method: string; path: string; desc: string; children?: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const colors: Record<string, { bg: string; text: string }> = {
    GET:  { bg: 'rgba(59,130,246,0.1)',  text: '#60a5fa' },
    POST: { bg: 'rgba(34,197,94,0.1)',   text: '#4ade80' },
    PATCH:{ bg: 'rgba(245,158,11,0.1)',  text: '#fbbf24' },
  };
  const c = colors[method] ?? { bg: 'rgba(148,163,184,0.1)', text: '#94a3b8' };
  return (
    <div style={{ border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, overflow: 'hidden' }}>
      <button onClick={() => setOpen(o => !o)} style={{
        width: '100%', display: 'flex', alignItems: 'center', gap: 12,
        padding: '14px 16px', background: 'transparent', border: 'none',
        cursor: 'pointer', textAlign: 'left',
      }}>
        <span style={{
          fontSize: 9, fontWeight: 800, padding: '3px 8px', borderRadius: 5,
          background: c.bg, color: c.text, letterSpacing: '0.06em', flexShrink: 0,
        }}>{method}</span>
        <code style={{ fontSize: 13, color: '#f1f5f9', fontFamily: 'monospace', flex: 1 }}>{path}</code>
        {open ? <ChevronUp size={13} color="#475569" /> : <ChevronDown size={13} color="#475569" />}
      </button>
      {open && (
        <div style={{ padding: '0 16px 16px', background: 'rgba(255,255,255,0.01)', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
          <p style={{ fontSize: 13, color: '#64748b', marginTop: 12, marginBottom: 4 }}>{desc}</p>
          {children}
        </div>
      )}
    </div>
  );
}

function Step({ n, icon: Icon, title, children }: {
  n: number; icon: React.ElementType; title: string; children: React.ReactNode;
}) {
  return (
    <div style={{ display: 'flex', gap: 20 }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div style={{
          width: 38, height: 38, borderRadius: 999, flexShrink: 0,
          background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.25)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Icon size={17} color="#22c55e" />
        </div>
        <div style={{ flex: 1, width: 1, background: 'rgba(255,255,255,0.05)', marginTop: 6 }} />
      </div>
      <div style={{ paddingBottom: 32, flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: '#22c55e', background: 'rgba(34,197,94,0.1)', padding: '2px 8px', borderRadius: 999 }}>
            Step {n}
          </span>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: '#f1f5f9', margin: 0 }}>{title}</h3>
        </div>
        <div style={{ fontSize: 14, color: '#64748b', lineHeight: 1.7 }}>{children}</div>
      </div>
    </div>
  );
}

// ── Main page ───────────────────────────────────────────────────────────────

export default function DocsPage() {
  const [active, setActive]     = useState('overview');
  const [scrollPct, setScrollPct] = useState(0);
  const observerRef = useRef<IntersectionObserver | null>(null);

  // Scroll progress bar
  useEffect(() => {
    function onScroll() {
      const el  = document.documentElement;
      const pct = (el.scrollTop / (el.scrollHeight - el.clientHeight)) * 100;
      setScrollPct(Math.min(100, Math.max(0, pct)));
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Active section tracking via IntersectionObserver
  useEffect(() => {
    if (observerRef.current) observerRef.current.disconnect();

    observerRef.current = new IntersectionObserver(
      entries => {
        // Pick the topmost visible section
        const visible = entries
          .filter(e => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible.length > 0) setActive(visible[0].target.id);
      },
      { rootMargin: '-10% 0px -60% 0px', threshold: 0 },
    );

    NAV_SECTIONS.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (el) observerRef.current!.observe(el);
    });

    return () => observerRef.current?.disconnect();
  }, []);

  function scrollTo(id: string) {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  return (
    <>
      <style>{`
        html, body { margin: 0; padding: 0; background: #060b14; }

        .docs-layout { display: flex; min-height: 100vh; }

        .docs-sidebar {
          display: none;
          width: 248px;
          flex-shrink: 0;
          padding: 28px 16px 40px;
          border-right: 1px solid rgba(255,255,255,0.06);
          position: sticky;
          top: 64px;
          height: calc(100vh - 64px);
          overflow-y: auto;
        }
        @media (min-width: 900px) { .docs-sidebar { display: block; } }

        .docs-main {
          flex: 1;
          padding: 40px 24px 100px;
          max-width: 800px;
          margin: 0 auto;
        }
        @media (min-width: 900px) { .docs-main { padding: 52px 52px 100px; } }

        .sidebar-group {
          font-size: 10px; font-weight: 700; color: #1e293b;
          letter-spacing: 0.12em; text-transform: uppercase;
          padding: 18px 10px 6px;
        }
        .sidebar-group:first-child { padding-top: 4px; }

        .sidebar-link {
          display: flex; align-items: center;
          padding: 7px 10px; border-radius: 8px;
          font-size: 13px; color: #475569;
          text-decoration: none; cursor: pointer;
          border: none; background: transparent; width: 100%;
          text-align: left;
          transition: background 0.12s, color 0.12s, border-color 0.12s;
          border-left: 2px solid transparent;
          margin-bottom: 1px;
        }
        .sidebar-link:hover { background: rgba(255,255,255,0.03); color: #94a3b8; }
        .sidebar-link.active {
          background: rgba(34,197,94,0.06);
          color: #22c55e;
          border-left-color: #22c55e;
          font-weight: 600;
        }

        .section { margin-bottom: 64px; scroll-margin-top: 80px; }
        .section-title {
          font-size: 22px; font-weight: 800; color: #f1f5f9;
          letter-spacing: -0.03em; margin-bottom: 6px; margin-top: 0;
        }
        .section-sub { font-size: 14px; color: #475569; margin-bottom: 20px; line-height: 1.7; margin-top: 0; }

        .badge {
          display: inline-flex; align-items: center; gap: 6px;
          background: rgba(34,197,94,0.08); border: 1px solid rgba(34,197,94,0.2);
          border-radius: 999px; padding: 3px 12px; font-size: 11px;
          font-weight: 600; color: #22c55e; margin-bottom: 28px;
        }

        .state-row {
          display: flex; align-items: flex-start; gap: 16;
          padding: 12px 16px; border-bottom: 1px solid rgba(255,255,255,0.05); font-size: 13px;
        }
        .state-row:last-child { border-bottom: none; }

        /* progress bar */
        .scroll-progress {
          position: fixed; top: 0; left: 0; height: 2px; z-index: 100;
          background: linear-gradient(90deg, #22c55e, #4ade80);
          transition: width 0.1s linear;
          box-shadow: 0 0 8px rgba(34,197,94,0.5);
        }
      `}</style>

      {/* Scroll progress bar */}
      <div className="scroll-progress" style={{ width: `${scrollPct}%` }} />

      <div style={{ background: '#060b14', minHeight: '100vh' }}>

        {/* ── TOP NAV ─────────────────────────────────────────────────── */}
        <div style={{
          position: 'sticky', top: 0, zIndex: 50,
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          background: 'rgba(6,11,20,0.96)',
          backdropFilter: 'blur(14px)',
          padding: '0 24px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 64,
        }}>
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 12, textDecoration: 'none' }}>
            <Image src="/logo.png" alt="SMSGate" width={40} height={40} style={{ borderRadius: 10 }} />
            <span style={{ fontWeight: 700, fontSize: 16, color: '#fff', letterSpacing: '-0.02em' }}>SMSGate</span>
            <span style={{ fontSize: 12, color: '#334155', marginLeft: 2 }}>/ Docs</span>
          </Link>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <Link href="/login" style={{
              fontSize: 13, color: '#64748b', textDecoration: 'none',
              padding: '7px 16px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.08)',
            }}>
              Sign in
            </Link>
            <Link href="/register" style={{
              fontSize: 13, fontWeight: 600, color: '#000', textDecoration: 'none',
              padding: '7px 16px', borderRadius: 8,
              background: 'linear-gradient(135deg,#22c55e,#16a34a)',
            }}>
              Get started free
            </Link>
          </div>
        </div>

        <div className="docs-layout">

          {/* ── SIDEBAR ─────────────────────────────────────────────── */}
          <aside className="docs-sidebar">
            {GROUPS.map(group => (
              <div key={group}>
                <div className="sidebar-group">{group}</div>
                {NAV_SECTIONS.filter(s => s.group === group).map(({ id, label }) => (
                  <button
                    key={id}
                    className={`sidebar-link ${active === id ? 'active' : ''}`}
                    onClick={() => scrollTo(id)}
                  >
                    {label}
                  </button>
                ))}
              </div>
            ))}
          </aside>

          {/* ── MAIN CONTENT ────────────────────────────────────────── */}
          <main className="docs-main">

            {/* Hero */}
            <div style={{ marginBottom: 56 }}>
              <span className="badge"><BookOpen size={11} /> Documentation</span>
              <h1 style={{ fontSize: 'clamp(28px,4vw,40px)', fontWeight: 900, color: '#f1f5f9', letterSpacing: '-0.04em', marginBottom: 12, lineHeight: 1.15, marginTop: 0 }}>
                SMSGate API Guide
              </h1>
              <p style={{ fontSize: 15, color: '#64748b', lineHeight: 1.7, maxWidth: 560, margin: 0 }}>
                Everything you need to send SMS programmatically using your own Android phone as the gateway.
                No per-message fees, no lock-in.
              </p>
            </div>

            {/* ── OVERVIEW ─────────────────────────────────────────── */}
            <section id="overview" className="section">
              <h2 className="section-title">How it works</h2>
              <p className="section-sub">
                SMSGate is a self-hosted SMS gateway that uses an Android phone you already own.
                Your server sends an HTTP request, the cloud queues it, and the Android app picks it up
                within seconds and sends it through the phone's SIM card.
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px,1fr))', gap: 12 }}>
                {[
                  { icon: Globe,      title: 'Your app',      desc: 'Makes a REST API call to SMSGate'    },
                  { icon: Code2,      title: 'Cloud server',  desc: 'Queues and routes the message'       },
                  { icon: Smartphone, title: 'Android phone', desc: 'Picks it up and sends via SIM card'  },
                  { icon: Activity,   title: 'Delivery',      desc: 'Status updated in real-time'         },
                ].map(({ icon: Icon, title, desc }) => (
                  <div key={title} style={{
                    padding: '16px', borderRadius: 12,
                    background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)',
                  }}>
                    <div style={{
                      width: 32, height: 32, borderRadius: 8, marginBottom: 10,
                      background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.15)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <Icon size={15} color="#22c55e" />
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#f1f5f9', marginBottom: 4 }}>{title}</div>
                    <div style={{ fontSize: 12, color: '#475569' }}>{desc}</div>
                  </div>
                ))}
              </div>
            </section>

            {/* ── QUICKSTART ───────────────────────────────────────── */}
            <section id="quickstart" className="section">
              <h2 className="section-title">Quick Start</h2>
              <p className="section-sub">From zero to sending your first SMS in under 10 minutes.</p>

              <Step n={1} icon={Globe} title="Create your account">
                <p style={{ margin: 0 }}>Register at <Link href="/register" style={{ color: '#22c55e' }}>sms-gate-app-t3ay.vercel.app/register</Link> — free, no credit card needed.</p>
              </Step>
              <Step n={2} icon={Key} title="Create an API key">
                <p style={{ margin: 0 }}>Go to <strong style={{ color: '#94a3b8' }}>Dashboard → API Keys</strong> and click <em>Create key</em>. Store it safely — it won't be shown again.</p>
              </Step>
              <Step n={3} icon={Download} title="Download & install the Android app">
                <p style={{ margin: '0 0 10px' }}>Download the APK and install it on your Android phone. Enable "Install from unknown sources" if prompted.</p>
                <a href={APK_URL} style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  padding: '8px 14px', borderRadius: 8, fontSize: 13, fontWeight: 600,
                  background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)',
                  color: '#22c55e', textDecoration: 'none',
                }}>
                  <Download size={13} /> Download APK
                </a>
              </Step>
              <Step n={4} icon={Smartphone} title="Register your device">
                <p style={{ margin: 0 }}>In the dashboard go to <strong style={{ color: '#94a3b8' }}>Devices → Add device</strong>.
                Set a name, login and password. Open the Android app → Settings → enter your server URL and those credentials, then toggle the gateway on.</p>
              </Step>
              <Step n={5} icon={Code2} title="Send your first SMS">
                <p style={{ margin: '0 0 8px' }}>Once the device shows as <span style={{ color: '#22c55e', fontWeight: 600 }}>Online</span>, make your first call:</p>
                <Code lang="curl" code={`curl -X POST ${API_BASE}/api/v1/messages \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "message": "Hello from SMSGate!",
    "phoneNumbers": ["+233244000000"]
  }'`} />
              </Step>
            </section>

            {/* ── SEND SMS ─────────────────────────────────────────── */}
            <section id="send-sms" className="section">
              <h2 className="section-title">Sending SMS</h2>
              <p className="section-sub">
                POST a JSON body to <code style={{ color: '#22c55e', fontSize: 13 }}>/api/v1/messages</code>.
                You can target multiple recipients and optionally pick which SIM to use.
              </p>
              <Code lang="json — request body" code={`{
  "message":      "Your OTP is 8847",          // required
  "phoneNumbers": ["+233244000000"],             // required — array of E.164 numbers
  "simNumber":    1,                            // optional — 1 or 2 (default: first SIM)
  "deviceId":     "device-uuid"                 // optional — route to a specific device
}`} />
              <Code lang="json — response 202" code={`{
  "id":     "msg_01j9...",
  "status": "queued"
}`} />
            </section>

            {/* ── CHECK STATUS ─────────────────────────────────────── */}
            <section id="check-status" className="section">
              <h2 className="section-title">Checking Delivery Status</h2>
              <p className="section-sub">Poll the message endpoint with the ID returned when you sent the message.</p>
              <Code lang="curl" code={`curl ${API_BASE}/api/v1/messages/msg_01j9... \\
  -H "Authorization: Bearer YOUR_API_KEY"`} />
              <Code lang="json — response" code={`{
  "id":    "msg_01j9...",
  "state": "Delivered",
  "recipients": [
    {
      "phoneNumber": "+233244000000",
      "state":       "Delivered",
      "sentAt":      "2025-01-15T10:30:00.000Z",
      "deliveredAt": "2025-01-15T10:30:04.000Z"
    }
  ]
}`} />
            </section>

            {/* ── CODE EXAMPLES ────────────────────────────────────── */}
            <section id="code-examples" className="section">
              <h2 className="section-title">Code Examples</h2>
              <p className="section-sub">Drop-in snippets for popular languages.</p>

              <p style={{ fontSize: 12, fontWeight: 700, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4, marginTop: 0 }}>JavaScript / Node.js</p>
              <Code lang="javascript" code={`const res = await fetch('${API_BASE}/api/v1/messages', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY',
    'Content-Type':  'application/json',
  },
  body: JSON.stringify({
    message:      'Hello from SMSGate!',
    phoneNumbers: ['+233244000000'],
    simNumber:    1,
  }),
});
const { id, status } = await res.json();
console.log(id, status); // msg_01j9..., queued`} />

              <p style={{ fontSize: 12, fontWeight: 700, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4, marginTop: 24 }}>Python</p>
              <Code lang="python" code={`import requests

response = requests.post(
    '${API_BASE}/api/v1/messages',
    headers={'Authorization': 'Bearer YOUR_API_KEY'},
    json={
        'message':      'Hello from SMSGate!',
        'phoneNumbers': ['+233244000000'],
        'simNumber':    1,
    },
)
data = response.json()
print(data['id'])  # msg_01j9...`} />

              <p style={{ fontSize: 12, fontWeight: 700, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4, marginTop: 24 }}>PHP</p>
              <Code lang="php" code={`$ch = curl_init('${API_BASE}/api/v1/messages');
curl_setopt_array($ch, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_POST           => true,
    CURLOPT_HTTPHEADER     => [
        'Authorization: Bearer YOUR_API_KEY',
        'Content-Type: application/json',
    ],
    CURLOPT_POSTFIELDS => json_encode([
        'message'      => 'Hello from SMSGate!',
        'phoneNumbers' => ['+233244000000'],
        'simNumber'    => 1,
    ]),
]);
$data = json_decode(curl_exec($ch), true);
echo $data['id'];`} />

              <p style={{ fontSize: 12, fontWeight: 700, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4, marginTop: 24 }}>Go</p>
              <Code lang="go" code={`package main

import (
    "bytes"; "encoding/json"; "fmt"; "net/http"
)

func main() {
    body, _ := json.Marshal(map[string]any{
        "message":      "Hello from SMSGate!",
        "phoneNumbers": []string{"+233244000000"},
        "simNumber":    1,
    })
    req, _ := http.NewRequest("POST", "${API_BASE}/api/v1/messages", bytes.NewReader(body))
    req.Header.Set("Authorization", "Bearer YOUR_API_KEY")
    req.Header.Set("Content-Type", "application/json")

    resp, _ := http.DefaultClient.Do(req)
    defer resp.Body.Close()

    var result map[string]any
    json.NewDecoder(resp.Body).Decode(&result)
    fmt.Println(result["id"])
}`} />
            </section>

            {/* ── AUTHENTICATION ───────────────────────────────────── */}
            <section id="authentication" className="section">
              <h2 className="section-title">Authentication</h2>
              <p className="section-sub">
                All endpoints (except <code style={{ color: '#22c55e', fontSize: 12 }}>/health</code>) require a Bearer token.
                Create one from <strong style={{ color: '#94a3b8' }}>Dashboard → API Keys</strong>.
              </p>
              <Code lang="http header" code={`Authorization: Bearer sk_live_your_api_key_here`} />
              <div style={{
                marginTop: 16, padding: '14px 16px', borderRadius: 10,
                background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.18)',
              }}>
                <p style={{ fontSize: 13, color: '#92400e', margin: 0 }}>
                  <strong style={{ color: '#d97706' }}>Keep your API key secret.</strong>{' '}
                  Never expose it in frontend JavaScript or public repos. Use environment variables.
                </p>
              </div>
            </section>

            {/* ── ENDPOINTS ────────────────────────────────────────── */}
            <section id="endpoints" className="section">
              <h2 className="section-title">Endpoints</h2>
              <p className="section-sub">Base URL: <code style={{ color: '#22c55e', fontSize: 13 }}>{API_BASE}</code></p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <Endpoint method="POST" path="/api/v1/messages" desc="Send an SMS to one or more recipients">
                  <Code lang="request body" code={`{
  "message":      string,   // required
  "phoneNumbers": string[], // required — E.164 format e.g. +233244000000
  "simNumber":    number,   // optional — 1 or 2
  "deviceId":     string    // optional
}`} />
                  <Code lang="response 202" code={`{ "id": "msg_...", "status": "queued" }`} />
                </Endpoint>

                <Endpoint method="GET" path="/api/v1/messages" desc="List your 50 most recent messages">
                  <Code lang="response 200" code={`[{
  "id":           "msg_...",
  "message":      "Hello!",
  "phoneNumbers": ["+233244000000"],
  "state":        "Delivered",
  "recipients":   [{ "phoneNumber": "+233244000000", "state": "Delivered" }],
  "createdAt":    "2025-01-15T10:30:00.000Z"
}]`} />
                </Endpoint>

                <Endpoint method="GET" path="/api/v1/messages/:id" desc="Get a specific message and per-recipient delivery status">
                  <Code lang="response 200" code={`{
  "id":         "msg_...",
  "state":      "Delivered",
  "recipients": [{
    "phoneNumber": "+233244000000",
    "state":       "Delivered",
    "sentAt":      "2025-01-15T10:30:00.000Z",
    "deliveredAt": "2025-01-15T10:30:04.000Z"
  }]
}`} />
                </Endpoint>

                <Endpoint method="GET" path="/api/v1/devices" desc="List your registered devices and their SIM cards">
                  <Code lang="response 200" code={`[{
  "id":       "device-uuid",
  "name":     "My Phone",
  "isOnline": true,
  "sims": [{
    "slotIndex":   0,
    "displayName": "MTN Ghana",
    "phoneNumber": "+233244000000"
  }]
}]`} />
                </Endpoint>

                <Endpoint method="GET" path="/health" desc="Health check — no auth required">
                  <Code lang="response 200" code={`{ "status": "ok", "timestamp": "2025-01-15T10:30:00.000Z" }`} />
                </Endpoint>
              </div>
            </section>

            {/* ── MESSAGE STATES ───────────────────────────────────── */}
            <section id="message-states" className="section">
              <h2 className="section-title">Message States</h2>
              <p className="section-sub">A message moves through these states from creation to delivery.</p>
              <div style={{ border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, overflow: 'hidden' }}>
                {[
                  ['Pending',   '#f59e0b', 'Queued and waiting for an online device to pick it up'],
                  ['Processed', '#60a5fa', 'Device received it and is actively sending'],
                  ['Sent',      '#22c55e', 'Handed off to the carrier network'],
                  ['Delivered', '#22c55e', 'Carrier confirmed delivery to the handset'],
                  ['Failed',    '#ef4444', 'Could not send — check the device is online and has signal'],
                ].map(([state, color, desc]) => (
                  <div key={state} className="state-row">
                    <span style={{
                      fontSize: 10, fontWeight: 800, padding: '3px 10px', borderRadius: 999,
                      background: `${color}18`, color, whiteSpace: 'nowrap', flexShrink: 0,
                    }}>{state}</span>
                    <span style={{ fontSize: 13, color: '#64748b' }}>{desc}</span>
                  </div>
                ))}
              </div>
            </section>

            {/* ── ERRORS & LIMITS ──────────────────────────────────── */}
            <section id="errors" className="section">
              <h2 className="section-title">Errors &amp; Rate Limits</h2>
              <p className="section-sub">All error responses follow the same shape.</p>
              <Code lang="json — error response" code={`{ "error": "Human-readable error message" }`} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 16 }}>
                {[
                  ['401', '#ef4444', 'Unauthorized — missing or invalid API key'],
                  ['403', '#f59e0b', 'Forbidden — your plan does not allow this action'],
                  ['429', '#f59e0b', 'Monthly SMS limit reached — upgrade your plan'],
                  ['502', '#94a3b8', 'No device online — connect an Android device first'],
                ].map(([code, color, desc]) => (
                  <div key={code} style={{
                    display: 'flex', alignItems: 'center', gap: 14,
                    padding: '12px 14px', borderRadius: 10,
                    background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)',
                  }}>
                    <span style={{ fontSize: 12, fontWeight: 800, color, fontFamily: 'monospace', minWidth: 28 }}>{code}</span>
                    <span style={{ fontSize: 13, color: '#64748b' }}>{desc}</span>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: 20 }}>
                <p style={{ fontSize: 13, fontWeight: 600, color: '#94a3b8', marginBottom: 8 }}>Monthly SMS quotas by plan:</p>
                <Code lang="" code={`Free     →  100 SMS / month
Basic    →  5,000 SMS / month   (GHS 15)
Pro      →  30,000 SMS / month  (GHS 40)
Business →  Unlimited           (GHS 100)`} />
              </div>
            </section>

            {/* ── CTA ──────────────────────────────────────────────── */}
            <div style={{
              padding: '32px 28px', borderRadius: 16,
              background: 'linear-gradient(135deg, rgba(34,197,94,0.08) 0%, rgba(34,197,94,0.02) 100%)',
              border: '1px solid rgba(34,197,94,0.2)', textAlign: 'center',
            }}>
              <h3 style={{ fontSize: 20, fontWeight: 800, color: '#f1f5f9', marginBottom: 8, marginTop: 0 }}>Ready to get started?</h3>
              <p style={{ fontSize: 14, color: '#475569', marginBottom: 20 }}>
                Create a free account and send your first SMS in under 10 minutes.
              </p>
              <Link href="/register" style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                padding: '11px 24px', borderRadius: 10, fontWeight: 700, fontSize: 14,
                background: 'linear-gradient(135deg,#22c55e,#16a34a)', color: '#000', textDecoration: 'none',
              }}>
                Create free account <ArrowRight size={15} />
              </Link>
            </div>

          </main>
        </div>

        {/* Footer */}
        <div style={{
          borderTop: '1px solid rgba(255,255,255,0.05)', padding: '20px 32px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12,
        }}>
          <span style={{ fontSize: 12, color: '#1e293b' }}>SMSGate &copy; {new Date().getFullYear()}</span>
          <Link href="/" style={{ fontSize: 12, color: '#334155', textDecoration: 'none' }}>← Back to home</Link>
        </div>
      </div>
    </>
  );
}
