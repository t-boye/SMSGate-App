import Link from 'next/link';
import Image from 'next/image';
import {
  Smartphone, Key, Zap, Shield, Globe, Code2,
  ArrowRight, Check, Terminal, MessageSquare, BarChart3, RefreshCw,
} from 'lucide-react';

const FEATURES = [
  { icon: Smartphone,   color: 'text-green-400',  bg: 'bg-green-500/10',  title: 'Real SIM Cards',      desc: 'Uses your actual phone SIM — no virtual numbers, no per-SMS fees to a carrier.' },
  { icon: Code2,        color: 'text-blue-400',   bg: 'bg-blue-500/10',   title: 'REST API',             desc: 'POST /messages and your phone sends it. Simple JSON, works from any language.' },
  { icon: Shield,       color: 'text-purple-400', bg: 'bg-purple-500/10', title: 'E2E Encryption',       desc: 'AES-256-CBC with your key. Messages are encrypted before leaving your server.' },
  { icon: RefreshCw,    color: 'text-yellow-400', bg: 'bg-yellow-500/10', title: 'Delivery Receipts',    desc: 'Track every message through Pending → Sent → Delivered. Know what was received.' },
  { icon: Globe,        color: 'text-cyan-400',   bg: 'bg-cyan-500/10',   title: 'Multi-Tenant',         desc: 'Each account is fully isolated. Build a service — add your own customers.' },
  { icon: BarChart3,    color: 'text-orange-400', bg: 'bg-orange-500/10', title: 'Usage Dashboard',      desc: 'Live message logs, device status, monthly stats, and per-API-key analytics.' },
];

const STEPS = [
  { n: '01', title: 'Register & add your device', desc: 'Create a free account, then add your Android phone from the Devices page. You get a device token — paste it into the app.' },
  { n: '02', title: 'Open the Android app',        desc: 'Install SMSGate on your Android phone, go to Settings → Cloud Server, and enter your server URL and device credentials.' },
  { n: '03', title: 'Send via REST API',            desc: 'POST to /api/v1/messages with your API key and phone number. Your phone picks it up within 5 seconds and sends.' },
];

const PLANS = [
  { name: 'Free',     price: 'GHS 0',    monthly: true,  sms: '100',    devices: '1',   keys: '1',    cta: null },
  { name: 'Basic',    price: 'GHS 30',   monthly: true,  sms: '5,000',  devices: '3',   keys: '5',    cta: '/register', popular: false },
  { name: 'Pro',      price: 'GHS 85',   monthly: true,  sms: '30,000', devices: '10',  keys: '∞',    cta: '/register', popular: true },
  { name: 'Business', price: 'Custom',   monthly: false, sms: '∞',      devices: '∞',   keys: '∞',    cta: '/register', popular: false },
];

export default function LandingPage() {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'https://your-server.com';

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-base)' }}>

      {/* ── Navbar ───────────────────────────────── */}
      <header className="fixed top-0 inset-x-0 z-50 border-b" style={{
        background: 'rgba(3,5,11,0.85)',
        backdropFilter: 'blur(16px)',
        borderColor: 'var(--border)',
      }}>
        <div className="max-w-6xl mx-auto px-5 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Image src="/logo.png" alt="SMSGate" width={28} height={28} className="rounded-lg" />
            <span className="font-bold text-white tracking-tight">SMSGate</span>
          </div>
          <nav className="hidden md:flex items-center gap-6 text-sm text-gray-500">
            <a href="#features"  className="hover:text-white transition-colors">Features</a>
            <a href="#how"       className="hover:text-white transition-colors">How it works</a>
            <a href="#pricing"   className="hover:text-white transition-colors">Pricing</a>
            <a href="#docs-link" className="hover:text-white transition-colors">Docs</a>
          </nav>
          <div className="flex items-center gap-2">
            <Link href="/login"    className="btn-ghost text-xs px-3 py-1.5">Sign In</Link>
            <Link href="/register" className="btn-primary text-xs px-3 py-1.5">Get Started</Link>
          </div>
        </div>
      </header>

      {/* ── Hero ─────────────────────────────────── */}
      <section className="relative pt-32 pb-20 px-5 overflow-hidden">
        {/* Glow blobs */}
        <div className="hero-glow" style={{ top: '-100px', left: '50%', transform: 'translateX(-50%)' }} />
        <div className="hero-glow" style={{ top: '100px', left: '10%', width: '300px', height: '300px', opacity: 0.5 }} />

        <div className="max-w-4xl mx-auto text-center relative z-10">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 rounded-full px-3 py-1 mb-6 text-xs font-medium border" style={{
            background: 'var(--green-subtle)',
            borderColor: 'rgba(34,197,94,0.2)',
            color: '#4ade80',
          }}>
            <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
            Open Source — Self-hostable
          </div>

          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold leading-[1.1] tracking-tight mb-6">
            <span className="gradient-text-white">Your Android phone,</span>
            <br />
            <span className="gradient-text">an SMS gateway.</span>
          </h1>

          <p className="text-lg sm:text-xl text-gray-500 max-w-2xl mx-auto mb-10 leading-relaxed">
            Turn any Android device into a programmable SMS gateway.
            Send via REST API — no SIM card rental, no third-party carrier, no recurring fees.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 mb-14">
            <Link href="/register" className="btn-primary px-6 py-3 text-sm">
              Start for free <ArrowRight size={15} />
            </Link>
            <Link href="/login" className="btn-ghost px-6 py-3 text-sm">
              Sign in to dashboard
            </Link>
          </div>

          {/* Code teaser */}
          <div className="max-w-xl mx-auto rounded-2xl border overflow-hidden text-left" style={{
            background: 'var(--bg-surface)',
            borderColor: 'var(--border)',
            boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
          }}>
            <div className="flex items-center gap-2 px-4 py-2.5 border-b" style={{ borderColor: 'var(--border)', background: 'var(--bg-raised)' }}>
              <div className="w-2.5 h-2.5 rounded-full bg-red-500/60" />
              <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/60" />
              <div className="w-2.5 h-2.5 rounded-full bg-green-500/60" />
              <span className="ml-2 text-xs text-gray-600 font-mono">Send an SMS</span>
            </div>
            <pre className="px-5 py-4 text-xs font-mono text-left overflow-x-auto leading-relaxed">
              <span className="text-gray-600">$ </span>
              <span className="text-blue-300">curl</span>
              <span className="text-white"> -X POST {apiUrl}/api/v1/messages \{'\n'}  </span>
              <span className="text-yellow-300">-H</span>
              <span className="text-green-300"> &quot;Authorization: Bearer sk_...&quot;</span>
              <span className="text-white"> \{'\n'}  </span>
              <span className="text-yellow-300">-d</span>
              <span className="text-orange-300"> &apos;&#123;&quot;message&quot;:&quot;Hello!&quot;,&quot;phoneNumbers&quot;:[&quot;+233244000000&quot;]&#125;&apos;{'\n\n'}</span>
              <span className="text-gray-600">{'{ '}</span>
              <span className="text-green-300">&quot;id&quot;</span>
              <span className="text-white">: </span>
              <span className="text-yellow-300">&quot;msg_abc123&quot;</span>
              <span className="text-gray-500">,</span>
              <span className="text-green-300"> &quot;status&quot;</span>
              <span className="text-white">: </span>
              <span className="text-yellow-300">&quot;queued&quot;</span>
              <span className="text-gray-600"> {'}'}</span>
            </pre>
          </div>
        </div>
      </section>

      {/* ── Stats bar ────────────────────────────── */}
      <section className="border-y py-8" style={{ borderColor: 'var(--border)', background: 'var(--bg-surface)' }}>
        <div className="max-w-4xl mx-auto px-5 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          {[
            { v: '100%', l: 'Your own hardware' },
            { v: '<5s',  l: 'Message delivery' },
            { v: 'AES-256', l: 'Encryption' },
            { v: 'Free', l: 'To start' },
          ].map(({ v, l }) => (
            <div key={l}>
              <p className="text-2xl font-bold text-white">{v}</p>
              <p className="text-xs text-gray-600 mt-0.5">{l}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Features ─────────────────────────────── */}
      <section id="features" className="py-20 px-5">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-xs font-semibold tracking-widest text-green-400 uppercase mb-3">Features</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-white">Everything you need, nothing you don&apos;t</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {FEATURES.map(({ icon: Icon, color, bg, title, desc }) => (
              <div key={title} className="rounded-2xl p-6 border card-hover" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
                <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center mb-4`}>
                  <Icon size={18} className={color} />
                </div>
                <h3 className="font-semibold text-white mb-2">{title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ─────────────────────────── */}
      <section id="how" className="py-20 px-5 border-y" style={{ borderColor: 'var(--border)', background: 'var(--bg-surface)' }}>
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-xs font-semibold tracking-widest text-green-400 uppercase mb-3">How it works</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-white">Up and running in minutes</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {STEPS.map(({ n, title, desc }) => (
              <div key={n} className="relative">
                <div className="text-5xl font-black mb-4" style={{ color: 'rgba(34,197,94,0.12)' }}>{n}</div>
                <h3 className="font-semibold text-white mb-2">{title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing ──────────────────────────────── */}
      <section id="pricing" className="py-20 px-5">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-xs font-semibold tracking-widest text-green-400 uppercase mb-3">Pricing</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-white">Start free, scale as you grow</h2>
            <p className="text-gray-500 mt-3">All plans include REST API, dashboard, and delivery tracking.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {PLANS.map(plan => (
              <div key={plan.name} className={`relative rounded-2xl p-6 flex flex-col border ${plan.popular ? 'border-green-500/40' : 'card-hover'}`} style={{
                background: plan.popular ? 'linear-gradient(135deg, rgba(34,197,94,0.06), rgba(34,197,94,0.02))' : 'var(--bg-surface)',
                borderColor: plan.popular ? undefined : 'var(--border)',
              }}>
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 text-[10px] font-bold px-3 py-0.5 rounded-full bg-green-500 text-black">
                    Most Popular
                  </div>
                )}
                <h3 className="font-bold text-white">{plan.name}</h3>
                <div className="mt-2 mb-4">
                  <span className="text-2xl font-black text-white">{plan.price}</span>
                  {plan.monthly && <span className="text-xs text-gray-600 ml-1">/mo</span>}
                </div>
                <ul className="space-y-2 text-xs text-gray-400 flex-1 mb-6">
                  <li className="flex items-center gap-2"><Check size={11} className="text-green-400 shrink-0" /> {plan.sms} SMS / month</li>
                  <li className="flex items-center gap-2"><Check size={11} className="text-green-400 shrink-0" /> {plan.devices} device{plan.devices === '1' ? '' : 's'}</li>
                  <li className="flex items-center gap-2"><Check size={11} className="text-green-400 shrink-0" /> {plan.keys} API key{plan.keys === '1' ? '' : 's'}</li>
                </ul>
                {plan.cta ? (
                  <Link href={plan.cta} className={`btn-primary w-full text-xs py-2 ${!plan.popular ? 'opacity-80 hover:opacity-100' : ''}`}>
                    Get started
                  </Link>
                ) : (
                  <Link href="/register" className="btn-ghost w-full text-xs py-2">
                    Sign up free
                  </Link>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── API / Docs callout ────────────────────── */}
      <section id="docs-link" className="py-20 px-5 border-t" style={{ borderColor: 'var(--border)', background: 'var(--bg-surface)' }}>
        <div className="max-w-3xl mx-auto rounded-2xl border p-10 relative overflow-hidden" style={{ borderColor: 'rgba(34,197,94,0.2)', background: 'linear-gradient(135deg, rgba(34,197,94,0.05), transparent)' }}>
          <div className="hero-glow" style={{ top: '-100px', right: '-100px', width: '300px', height: '300px' }} />
          <div className="relative z-10 text-center">
            <Terminal size={32} className="text-green-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-3">Developer-first API</h2>
            <p className="text-gray-500 mb-6 max-w-md mx-auto">
              One endpoint. JSON in, SMS out. Works with curl, JavaScript, Python, PHP — anything that speaks HTTP.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <Link href="/register" className="btn-primary text-sm">
                Get your API key <ArrowRight size={14} />
              </Link>
              <Link href="/login" className="btn-ghost text-sm">
                View API docs
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────── */}
      <footer className="py-10 px-5 border-t" style={{ borderColor: 'var(--border)' }}>
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <Image src="/logo.png" alt="SMSGate" width={22} height={22} className="rounded-md opacity-70" />
            <span className="text-sm text-gray-600">SMSGate &copy; {new Date().getFullYear()}</span>
          </div>
          <div className="flex items-center gap-6 text-xs text-gray-700">
            <Link href="/login"    className="hover:text-gray-400 transition-colors">Sign In</Link>
            <Link href="/register" className="hover:text-gray-400 transition-colors">Sign Up</Link>
            <span className="text-gray-800">Built with Android + Next.js</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
