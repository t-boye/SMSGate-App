import Link from 'next/link';
import Image from 'next/image';
import {
  Smartphone, Key, Shield, RefreshCw, Code2, Globe,
  ArrowRight, Check, Send, BarChart2, Download, Wifi,
  CheckCircle2, Heart,
} from 'lucide-react';

const APK_URL = 'https://github.com/t-boye/SMSGate-App/releases/latest/download/smsgate.apk';
const QR_URL  = `https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(APK_URL)}&bgcolor=0d1117&color=22c55e&margin=8&qzone=1`;

/* ─── data ─────────────────────────────────────────────────────────────────── */

const FEATURES = [
  { icon: Smartphone, title: 'Real SIM card',       desc: 'Uses your actual Android phone and SIM — no virtual numbers, no carrier fees.',     color: '#22c55e' },
  { icon: Code2,      title: 'One REST endpoint',   desc: 'POST /messages, get a message ID. Any language, any framework, any platform.',       color: '#38bdf8' },
  { icon: Shield,     title: 'AES-256 encryption',  desc: 'Messages are encrypted before leaving your server. Zero-knowledge on the relay.',    color: '#a78bfa' },
  { icon: RefreshCw,  title: 'Delivery receipts',   desc: 'Pending → Sent → Delivered in real time. Every recipient tracked individually.',     color: '#fb923c' },
  { icon: Globe,      title: 'Multi-tenant',         desc: 'Fully isolated accounts. Build a commercial SMS service on top with your own users.', color: '#34d399' },
  { icon: BarChart2,  title: 'Usage dashboard',      desc: 'Message history, device status, monthly stats and per-key analytics, all live.',    color: '#f472b6' },
];

const STEPS = [
  { n: '01', title: 'Register & add your device',  desc: 'Create a free account, go to Devices, and add your Android phone. You get a login + password for the app.' },
  { n: '02', title: 'Connect the Android app',     desc: 'Install SMSGate on your phone. Open Settings → Cloud Server, enter your server URL and device credentials.' },
  { n: '03', title: 'Send via REST API',            desc: 'POST to /api/v1/messages with your API key. The phone picks it up within 5 seconds and sends the SMS.' },
];

const PLANS = [
  { name: 'Free',     price: 'GHS 0',   sub: 'forever', sms: '100',    devices: '1',  keys: '1',  popular: false, compare: null         },
  { name: 'Basic',    price: 'GHS 15',  sub: '/ month', sms: '5,000',  devices: '3',  keys: '5',  popular: false, compare: 'GHS 250+'   },
  { name: 'Pro',      price: 'GHS 40',  sub: '/ month', sms: '30,000', devices: '10', keys: '∞',  popular: true,  compare: 'GHS 1,500+' },
  { name: 'Business', price: 'GHS 100', sub: '/ month', sms: '∞',      devices: '∞',  keys: '∞',  popular: false, compare: 'GHS 5,000+' },
];

/* ─── page ──────────────────────────────────────────────────────────────────── */

export default function LandingPage() {
  const api = process.env.NEXT_PUBLIC_API_URL ?? 'https://sms-gate-app.vercel.app';

  return (
    <div style={{ background: '#080c14', color: '#e2e8f0', fontFamily: 'system-ui, sans-serif' }}>

      {/* ── NAV ─────────────────────────────────────────────────────────────── */}
      <header style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50,
        height: 64,
        display: 'flex', alignItems: 'center',
        padding: '0 32px',
        background: 'rgba(8,12,20,0.85)',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
      }}>
        <div style={{ maxWidth: 1120, width: '100%', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 32, height: 32, borderRadius: 8,
              background: 'rgba(34,197,94,0.1)',
              border: '1px solid rgba(34,197,94,0.25)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Image src="/logo.png" alt="SMSGate" width={18} height={18} />
            </div>
            <span style={{ fontWeight: 700, fontSize: 15, color: '#fff', letterSpacing: '-0.02em' }}>SMSGate</span>
          </div>

          {/* Links */}
          <nav style={{ display: 'flex', gap: 32, fontSize: 14 }}>
            {[['#features','Features'],['#how','How it works'],['#pricing','Pricing'],['#download','Download'],['/docs','Docs']].map(([h,l]) => (
              <a key={h} href={h} className="nav-link" style={{ color: '#64748b', textDecoration: 'none' }}>
                {l}
              </a>
            ))}
          </nav>

          {/* CTAs */}
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <Link href="/login" style={{
              padding: '7px 16px', borderRadius: 8, fontSize: 13, fontWeight: 500,
              color: '#94a3b8', textDecoration: 'none',
              border: '1px solid rgba(255,255,255,0.1)',
              background: 'transparent',
            }}>Sign in</Link>
            <Link href="/register" style={{
              padding: '8px 18px', borderRadius: 8, fontSize: 13, fontWeight: 700,
              color: '#000', textDecoration: 'none',
              background: 'linear-gradient(135deg,#22c55e,#16a34a)',
              boxShadow: '0 0 20px rgba(34,197,94,0.3)',
            }}>Get started free</Link>
          </div>
        </div>
      </header>

      {/* ── HERO ────────────────────────────────────────────────────────────── */}
      <section style={{
        position: 'relative',
        paddingTop: 140, paddingBottom: 100,
        overflow: 'hidden',
        textAlign: 'center',
      }}>
        {/* Background radial glows */}
        <div style={{
          position: 'absolute', top: -120, left: '50%', transform: 'translateX(-50%)',
          width: 800, height: 600,
          background: 'radial-gradient(ellipse, rgba(34,197,94,0.18) 0%, transparent 65%)',
          pointerEvents: 'none', filter: 'blur(40px)',
        }} />
        <div style={{
          position: 'absolute', top: 200, right: '5%',
          width: 400, height: 400,
          background: 'radial-gradient(ellipse, rgba(56,189,248,0.1) 0%, transparent 65%)',
          pointerEvents: 'none', filter: 'blur(60px)',
        }} />

        <div style={{ maxWidth: 900, margin: '0 auto', padding: '0 24px', position: 'relative', zIndex: 1 }}>

          {/* Badge */}
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginBottom: 28 }}>
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 7,
              padding: '6px 14px', borderRadius: 999,
              background: 'rgba(34,197,94,0.08)',
              border: '1px solid rgba(34,197,94,0.25)',
              fontSize: 12, fontWeight: 600, color: '#4ade80', letterSpacing: '0.02em',
            }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#4ade80', display: 'inline-block' }} />
              Open source · Self-hostable · Free to start
            </span>
          </div>

          {/* Headline */}
          <h1 style={{
            fontSize: 'clamp(42px, 7vw, 76px)',
            fontWeight: 800,
            lineHeight: 1.07,
            letterSpacing: '-0.04em',
            marginBottom: 24,
          }}>
            <span style={{ color: '#f1f5f9' }}>Your Android phone,</span>
            <br />
            <span style={{
              background: 'linear-gradient(135deg, #4ade80 0%, #22c55e 40%, #86efac 100%)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}>
              your SMS gateway.
            </span>
          </h1>

          {/* Sub */}
          <p style={{
            fontSize: 'clamp(16px, 2.5vw, 20px)',
            color: '#64748b', lineHeight: 1.7,
            maxWidth: 560, margin: '0 auto 40px',
          }}>
            Send SMS from any app via REST API using your real SIM card.
            No Twilio, no virtual numbers, no per-message platform fees.
          </p>

          {/* CTA buttons */}
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 64 }}>
            <Link href="/register" style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '13px 28px', borderRadius: 10, fontSize: 14, fontWeight: 700,
              color: '#000', textDecoration: 'none',
              background: 'linear-gradient(135deg,#22c55e,#16a34a)',
              boxShadow: '0 0 30px rgba(34,197,94,0.35), 0 4px 20px rgba(0,0,0,0.3)',
            }}>
              Start for free <ArrowRight size={16} />
            </Link>
            <Link href="/login" style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '13px 28px', borderRadius: 10, fontSize: 14, fontWeight: 500,
              color: '#94a3b8', textDecoration: 'none',
              border: '1px solid rgba(255,255,255,0.1)',
              background: 'rgba(255,255,255,0.03)',
            }}>
              Sign in to dashboard
            </Link>
          </div>

          {/* Terminal */}
          <div style={{
            maxWidth: 640, margin: '0 auto',
            borderRadius: 16, overflow: 'hidden',
            border: '1px solid rgba(255,255,255,0.08)',
            background: '#0d1117',
            boxShadow: '0 0 0 1px rgba(34,197,94,0.06), 0 40px 100px rgba(0,0,0,0.7)',
          }}>
            {/* Window bar */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '12px 16px',
              background: '#161b22',
              borderBottom: '1px solid rgba(255,255,255,0.06)',
            }}>
              <div style={{ display: 'flex', gap: 6 }}>
                {['#ff5f57','#febc2e','#28c840'].map(c => (
                  <div key={c} style={{ width: 12, height: 12, borderRadius: '50%', background: c, opacity: 0.7 }} />
                ))}
              </div>
              <span style={{ fontSize: 11, color: '#4b5563', fontFamily: 'monospace', marginLeft: 8 }}>
                POST /api/v1/messages
              </span>
            </div>
            {/* Code */}
            <pre style={{
              margin: 0, padding: '20px 24px',
              fontSize: 13, lineHeight: 1.9,
              fontFamily: '"Fira Code", "Cascadia Code", Consolas, monospace',
              overflowX: 'auto', textAlign: 'left',
              background: '#0d1117',
            }}>
              <span style={{ color: '#79c0ff' }}>curl</span>
              <span style={{ color: '#c9d1d9' }}> -X POST {api}/api/v1/messages \{'\n'}</span>
              <span style={{ color: '#c9d1d9' }}>  </span>
              <span style={{ color: '#e3b341' }}>-H </span>
              <span style={{ color: '#a5d6ff' }}>&quot;Authorization: Bearer sk_...&quot;</span>
              <span style={{ color: '#c9d1d9' }}> \{'\n'}</span>
              <span style={{ color: '#c9d1d9' }}>  </span>
              <span style={{ color: '#e3b341' }}>-d </span>
              <span style={{ color: '#7ee787' }}>&apos;&#123;&quot;message&quot;:&quot;Your OTP is 4821&quot;,&quot;phoneNumbers&quot;:[&quot;+233244000000&quot;]&#125;&apos;</span>
              <span style={{ color: '#c9d1d9' }}>{'\n\n'}</span>
              <span style={{ color: '#8b949e' }}>{'// '}response{'\n'}</span>
              <span style={{ color: '#c9d1d9' }}>{'{ '}</span>
              <span style={{ color: '#7ee787' }}>&quot;id&quot;</span>
              <span style={{ color: '#c9d1d9' }}>: </span>
              <span style={{ color: '#a5d6ff' }}>&quot;msg_7f3k2abc&quot;</span>
              <span style={{ color: '#c9d1d9' }}>, </span>
              <span style={{ color: '#7ee787' }}>&quot;status&quot;</span>
              <span style={{ color: '#c9d1d9' }}>: </span>
              <span style={{ color: '#7ee787' }}>&quot;queued&quot;</span>
              <span style={{ color: '#c9d1d9' }}>{' }'}</span>
            </pre>
          </div>
        </div>
      </section>

      {/* ── METRICS ─────────────────────────────────────────────────────────── */}
      <div style={{
        borderTop: '1px solid rgba(255,255,255,0.06)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        background: '#0d1117',
        padding: '36px 24px',
      }}>
        <div style={{
          maxWidth: 800, margin: '0 auto',
          display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16,
          textAlign: 'center',
        }}>
          {[
            { v: '100%',    l: 'Your hardware'  },
            { v: '<5s',     l: 'Delivery time'  },
            { v: 'AES-256', l: 'Encryption'     },
            { v: 'Free',    l: 'To get started' },
          ].map(({ v, l }) => (
            <div key={l}>
              <div style={{ fontSize: 26, fontWeight: 900, color: '#f1f5f9', letterSpacing: '-0.03em' }}>{v}</div>
              <div style={{ fontSize: 12, color: '#475569', marginTop: 4 }}>{l}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── FEATURES ────────────────────────────────────────────────────────── */}
      <section id="features" style={{ padding: '96px 24px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 60 }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.16em', color: '#22c55e', textTransform: 'uppercase', marginBottom: 12 }}>
              Features
            </div>
            <h2 style={{ fontSize: 'clamp(28px,5vw,42px)', fontWeight: 800, color: '#f1f5f9', letterSpacing: '-0.03em', marginBottom: 12 }}>
              Everything you need
            </h2>
            <p style={{ fontSize: 16, color: '#64748b', maxWidth: 420, margin: '0 auto', lineHeight: 1.65 }}>
              Built for developers who want SMS without third-party lock-in.
            </p>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: 16,
          }}>
            {FEATURES.map(({ icon: Icon, title, desc, color }) => (
              <div key={title} style={{
                padding: '28px 28px 32px',
                borderRadius: 16,
                background: '#0d1117',
                border: '1px solid rgba(255,255,255,0.07)',
                borderTop: `1px solid ${color}30`,
                transition: 'border-color 0.2s, transform 0.2s',
              }}>
                <div style={{
                  width: 44, height: 44, borderRadius: 12,
                  background: `${color}14`,
                  border: `1px solid ${color}30`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  marginBottom: 18,
                }}>
                  <Icon size={20} color={color} />
                </div>
                <h3 style={{ fontSize: 15, fontWeight: 700, color: '#f1f5f9', marginBottom: 8 }}>{title}</h3>
                <p style={{ fontSize: 14, color: '#64748b', lineHeight: 1.65, margin: 0 }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ────────────────────────────────────────────────────── */}
      <section id="how" style={{
        padding: '96px 24px',
        background: '#0d1117',
        borderTop: '1px solid rgba(255,255,255,0.06)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
      }}>
        <div style={{ maxWidth: 960, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 64 }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.16em', color: '#22c55e', textTransform: 'uppercase', marginBottom: 12 }}>
              How it works
            </div>
            <h2 style={{ fontSize: 'clamp(28px,5vw,42px)', fontWeight: 800, color: '#f1f5f9', letterSpacing: '-0.03em' }}>
              Up and running in 5 minutes
            </h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px,1fr))', gap: 40 }}>
            {STEPS.map(({ n, title, desc }) => (
              <div key={n}>
                <div style={{
                  width: 52, height: 52, borderRadius: 14,
                  background: 'rgba(34,197,94,0.08)',
                  border: '1px solid rgba(34,197,94,0.2)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 18, fontWeight: 900, color: '#4ade80',
                  marginBottom: 20, fontFamily: 'monospace',
                }}>
                  {n}
                </div>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: '#f1f5f9', marginBottom: 10 }}>{title}</h3>
                <p style={{ fontSize: 14, color: '#64748b', lineHeight: 1.7, margin: 0 }}>{desc}</p>
              </div>
            ))}
          </div>

          <div style={{ textAlign: 'center', marginTop: 56 }}>
            <Link href="/register" style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '12px 28px', borderRadius: 10, fontSize: 14, fontWeight: 700,
              color: '#000', textDecoration: 'none',
              background: 'linear-gradient(135deg,#22c55e,#16a34a)',
              boxShadow: '0 0 24px rgba(34,197,94,0.28)',
            }}>
              Get started free <ArrowRight size={15} />
            </Link>
          </div>
        </div>
      </section>

      {/* ── DOWNLOAD APP ────────────────────────────────────────────────────── */}
      <section id="download" style={{
        padding: '96px 24px',
        borderTop: '1px solid rgba(255,255,255,0.06)',
      }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 60 }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.16em', color: '#22c55e', textTransform: 'uppercase', marginBottom: 12 }}>
              Android App
            </div>
            <h2 style={{ fontSize: 'clamp(28px,5vw,42px)', fontWeight: 800, color: '#f1f5f9', letterSpacing: '-0.03em', marginBottom: 12 }}>
              Install on your Android phone
            </h2>
            <p style={{ fontSize: 15, color: '#64748b', maxWidth: 440, margin: '0 auto', lineHeight: 1.65 }}>
              Download the APK directly on your phone — no Google Play needed.
              Scan the QR code or tap the button below.
            </p>
          </div>

          {/* Main download card */}
          <div style={{
            maxWidth: 860, margin: '0 auto',
            display: 'grid', gridTemplateColumns: 'auto 1fr',
            gap: 0,
            borderRadius: 20,
            overflow: 'hidden',
            border: '1px solid rgba(34,197,94,0.2)',
            background: 'linear-gradient(135deg, rgba(34,197,94,0.06) 0%, rgba(34,197,94,0.02) 100%)',
          }}>
            {/* QR side */}
            <div style={{
              padding: '40px 40px',
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              borderRight: '1px solid rgba(255,255,255,0.06)',
              gap: 16,
            }}>
              <div style={{
                padding: 12, borderRadius: 16,
                background: '#0d1117',
                border: '1px solid rgba(34,197,94,0.2)',
                boxShadow: '0 0 24px rgba(34,197,94,0.08)',
              }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={QR_URL}
                  alt="Scan to download SMSGate APK"
                  width={160} height={160}
                  style={{ display: 'block', borderRadius: 8 }}
                />
              </div>
              <p style={{ fontSize: 12, color: '#4b5563', textAlign: 'center', margin: 0 }}>
                Scan with your Android camera
              </p>
            </div>

            {/* Info side */}
            <div style={{ padding: '40px 40px' }}>
              <h3 style={{ fontSize: 20, fontWeight: 800, color: '#f1f5f9', marginBottom: 6, letterSpacing: '-0.02em' }}>
                SMSGate for Android
              </h3>
              <p style={{ fontSize: 13, color: '#64748b', marginBottom: 28, lineHeight: 1.6 }}>
                Free download · Android 7.0+ · No Google Play required
              </p>

              {/* Install steps */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 32 }}>
                {[
                  { n: 1, text: 'Open this page in Chrome on your Android phone' },
                  { n: 2, text: 'Tap Download APK and allow the download' },
                  { n: 3, text: 'Open the file → Enable "Install unknown apps" for Chrome → Install' },
                  { n: 4, text: 'Open SMSGate, grant SMS permissions, connect to your server' },
                ].map(({ n, text }) => (
                  <div key={n} style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                    <div style={{
                      width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
                      background: 'rgba(34,197,94,0.1)',
                      border: '1px solid rgba(34,197,94,0.2)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 10, fontWeight: 700, color: '#4ade80',
                    }}>
                      {n}
                    </div>
                    <p style={{ fontSize: 13, color: '#94a3b8', margin: 0, lineHeight: 1.6 }}>{text}</p>
                  </div>
                ))}
              </div>

              {/* Requirements chips */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 28 }}>
                {['Android 7.0+', 'Active SIM card', 'SMS permission', 'Mobile data / Wi-Fi'].map(r => (
                  <span key={r} style={{
                    display: 'inline-flex', alignItems: 'center', gap: 6,
                    padding: '4px 12px', borderRadius: 999,
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    fontSize: 11, color: '#64748b',
                  }}>
                    <CheckCircle2 size={10} color="#22c55e" />
                    {r}
                  </span>
                ))}
              </div>

              {/* Download button */}
              <a href={APK_URL} style={{
                display: 'inline-flex', alignItems: 'center', gap: 9,
                padding: '12px 26px', borderRadius: 10,
                background: 'linear-gradient(135deg,#22c55e,#16a34a)',
                color: '#000', textDecoration: 'none',
                fontSize: 13, fontWeight: 700,
                boxShadow: '0 0 24px rgba(34,197,94,0.3)',
              }}>
                <Download size={16} />
                Download APK
              </a>
            </div>
          </div>

          {/* After install instructions */}
          <div style={{
            maxWidth: 860, margin: '24px auto 0',
            padding: '20px 28px',
            borderRadius: 12,
            background: '#0d1117',
            border: '1px solid rgba(255,255,255,0.06)',
            display: 'flex', alignItems: 'flex-start', gap: 14,
          }}>
            <div style={{
              width: 32, height: 32, borderRadius: 8, flexShrink: 0,
              background: 'rgba(56,189,248,0.1)',
              border: '1px solid rgba(56,189,248,0.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Wifi size={15} color="#38bdf8" />
            </div>
            <div>
              <p style={{ fontSize: 13, fontWeight: 600, color: '#e2e8f0', margin: '0 0 4px' }}>
                After installing the app
              </p>
              <p style={{ fontSize: 13, color: '#64748b', margin: 0, lineHeight: 1.6 }}>
                Open <strong style={{ color: '#94a3b8' }}>Settings → Cloud Server</strong> in the app,
                paste your server URL (<code style={{ color: '#4ade80', fontSize: 12 }}>https://sms-gate-app.vercel.app</code>),
                then enter the <strong style={{ color: '#94a3b8' }}>login</strong> and <strong style={{ color: '#94a3b8' }}>password</strong> from the
                Devices page in this dashboard. The device will appear as{' '}
                <span style={{ color: '#4ade80', fontWeight: 600 }}>Online</span> within 5 seconds.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── PRICING ─────────────────────────────────────────────────────────── */}
      <section id="pricing" style={{ padding: '96px 24px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 64 }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.16em', color: '#22c55e', textTransform: 'uppercase', marginBottom: 12 }}>
              Pricing
            </div>
            <h2 style={{ fontSize: 'clamp(28px,5vw,42px)', fontWeight: 800, color: '#f1f5f9', letterSpacing: '-0.03em', marginBottom: 12 }}>
              Simple, honest pricing
            </h2>
            <p style={{ fontSize: 15, color: '#64748b' }}>
              All plans include the REST API, full dashboard, and delivery receipts.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(240px,1fr))', gap: 16 }}>
            {PLANS.map(plan => (
              <div key={plan.name} style={{
                position: 'relative',
                padding: '28px 24px 28px',
                borderRadius: 16,
                background: plan.popular
                  ? 'linear-gradient(160deg, rgba(34,197,94,0.1) 0%, rgba(34,197,94,0.03) 100%)'
                  : '#0d1117',
                border: plan.popular
                  ? '1px solid rgba(34,197,94,0.4)'
                  : '1px solid rgba(255,255,255,0.07)',
                boxShadow: plan.popular ? '0 0 40px rgba(34,197,94,0.12)' : 'none',
                display: 'flex', flexDirection: 'column',
              }}>
                {plan.popular && (
                  <div style={{
                    position: 'absolute', top: -13, left: '50%', transform: 'translateX(-50%)',
                    padding: '3px 14px', borderRadius: 999,
                    background: '#22c55e', color: '#000',
                    fontSize: 10, fontWeight: 800, letterSpacing: '0.04em', whiteSpace: 'nowrap',
                  }}>
                    MOST POPULAR
                  </div>
                )}

                <div style={{ marginBottom: 20 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 10 }}>
                    {plan.name}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 8 }}>
                    <span style={{ fontSize: 32, fontWeight: 900, color: '#f1f5f9', letterSpacing: '-0.03em' }}>{plan.price}</span>
                    <span style={{ fontSize: 13, color: '#475569' }}>{plan.sub}</span>
                  </div>
                  {plan.compare && (
                    <div style={{ fontSize: 11, color: '#ef4444', display: 'flex', alignItems: 'center', gap: 5 }}>
                      <span style={{ textDecoration: 'line-through', opacity: 0.7 }}>Others: {plan.compare}</span>
                      <span style={{ color: '#22c55e', fontWeight: 700 }}>95% cheaper</span>
                    </div>
                  )}
                </div>

                <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 24px', display: 'flex', flexDirection: 'column', gap: 10, flex: 1 }}>
                  {[
                    `${plan.sms} SMS / month`,
                    `${plan.devices} device${plan.devices === '1' ? '' : 's'}`,
                    `${plan.keys} API key${plan.keys === '1' ? '' : 's'}`,
                    'Full dashboard access',
                  ].map(f => (
                    <li key={f} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: '#94a3b8' }}>
                      <Check size={13} color="#22c55e" style={{ flexShrink: 0 }} />
                      {f}
                    </li>
                  ))}
                </ul>

                <Link href="/register" style={{
                  display: 'block', textAlign: 'center',
                  padding: '10px 16px', borderRadius: 8,
                  fontSize: 13, fontWeight: 700, textDecoration: 'none',
                  background: plan.popular ? 'linear-gradient(135deg,#22c55e,#16a34a)' : 'rgba(255,255,255,0.06)',
                  color: plan.popular ? '#000' : '#94a3b8',
                  border: plan.popular ? 'none' : '1px solid rgba(255,255,255,0.1)',
                }}>
                  {plan.name === 'Free' ? 'Start for free' : 'Get started'}
                </Link>
              </div>
            ))}
          </div>
          <p style={{ textAlign: 'center', fontSize: 12, color: '#334155', marginTop: 24 }}>
            Prices in Ghanaian Cedis (GHS). Payments via Paystack. Plans reset monthly.
          </p>
        </div>
      </section>

      {/* ── CTA BANNER ──────────────────────────────────────────────────────── */}
      <section style={{
        padding: '80px 24px',
        background: '#0d1117',
        borderTop: '1px solid rgba(255,255,255,0.06)',
        textAlign: 'center',
        position: 'relative', overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', top: '50%', left: '50%',
          transform: 'translate(-50%,-50%)',
          width: 600, height: 400,
          background: 'radial-gradient(ellipse, rgba(34,197,94,0.12) 0%, transparent 65%)',
          pointerEvents: 'none', filter: 'blur(40px)',
        }} />
        <div style={{ maxWidth: 540, margin: '0 auto', position: 'relative', zIndex: 1 }}>
          <div style={{
            width: 56, height: 56, borderRadius: 14,
            background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.25)',
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            marginBottom: 24,
          }}>
            <Send size={26} color="#22c55e" />
          </div>
          <h2 style={{ fontSize: 'clamp(26px,4vw,38px)', fontWeight: 800, color: '#f1f5f9', letterSpacing: '-0.03em', marginBottom: 14 }}>
            Ready to send your first SMS?
          </h2>
          <p style={{ fontSize: 16, color: '#64748b', lineHeight: 1.7, marginBottom: 32 }}>
            Create your account, connect your Android phone, and call the API — all in under 5 minutes. No credit card required.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/register" style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '13px 28px', borderRadius: 10, fontSize: 14, fontWeight: 700,
              color: '#000', textDecoration: 'none',
              background: 'linear-gradient(135deg,#22c55e,#16a34a)',
              boxShadow: '0 0 28px rgba(34,197,94,0.32)',
            }}>
              Create free account <ArrowRight size={15} />
            </Link>
            <Link href="/login" style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '13px 28px', borderRadius: 10, fontSize: 14, fontWeight: 500,
              color: '#94a3b8', textDecoration: 'none',
              border: '1px solid rgba(255,255,255,0.1)',
              background: 'rgba(255,255,255,0.03)',
            }}>
              Sign in to dashboard
            </Link>
          </div>
        </div>
      </section>

      {/* ── FOOTER ──────────────────────────────────────────────────────────── */}
      <footer style={{
        padding: '32px 32px',
        borderTop: '1px solid rgba(255,255,255,0.06)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexWrap: 'wrap', gap: 16,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 28, height: 28, borderRadius: 7,
            background: 'rgba(34,197,94,0.08)',
            border: '1px solid rgba(34,197,94,0.18)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Image src="/logo.png" alt="SMSGate" width={15} height={15} />
          </div>
          <span style={{ fontSize: 13, color: '#334155', display: 'flex', alignItems: 'center', gap: 5 }}>
            SMSGate &copy; {new Date().getFullYear()} &mdash; Built with <Heart size={12} color="#ef4444" fill="#ef4444" /> by{' '}
            <Link href="https://github.com/t-boye" target="_blank" rel="noopener noreferrer"
              style={{ color: '#22c55e', textDecoration: 'none', fontWeight: 600 }}>
              Emmanuel Tete Boye
            </Link>
          </span>
        </div>
        <nav style={{ display: 'flex', gap: 24, fontSize: 13 }}>
          {[
            ['/docs',      'Docs'],
            ['/login',     'Sign In'],
            ['/register',  'Register'],
            ['#features',  'Features'],
            ['#pricing',   'Pricing'],
            ['https://github.com/t-boye/SMSGate-App', 'GitHub'],
          ].map(([href, label]) => (
            <Link key={href} href={href} style={{ color: '#334155', textDecoration: 'none' }}
              {...(href.startsWith('http') ? { target: '_blank', rel: 'noopener noreferrer' } : {})}>
              {label}
            </Link>
          ))}
        </nav>
      </footer>

    </div>
  );
}
