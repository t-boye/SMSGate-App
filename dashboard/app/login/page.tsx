'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import { setToken, setUser } from '@/lib/auth';
import Image from 'next/image';
import { AlertCircle, ArrowRight, Loader2, Eye, EyeOff, Shield, Activity, Send } from 'lucide-react';

const FEATURES = [
  { icon: Send,     text: 'Send & receive SMS via REST API' },
  { icon: Shield,   text: 'AES-256 end-to-end encryption'  },
  { icon: Activity, text: 'Real-time delivery webhooks'    },
];

const STATS = [
  { value: '99.9%', label: 'Uptime SLA'    },
  { value: '<30ms', label: 'API latency'   },
  { value: 'GHS 0', label: 'To get started' },
];

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow]         = useState(false);
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      const data = await api.login({ email, password });
      setToken(data.token);
      setUser(data.user);
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message ?? 'Login failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <style>{`
        html, body { margin: 0; padding: 0; }
        .auth-root {
          min-height: 100vh;
          display: flex;
          background: #060b14;
        }
        .auth-left {
          display: none;
          flex: 1;
          flex-direction: column;
          justify-content: space-between;
          padding: 48px;
          background: linear-gradient(145deg, #0a1628 0%, #060b14 60%);
          border-right: 1px solid rgba(34,197,94,0.12);
          position: relative;
          overflow: hidden;
        }
        @media (min-width: 768px) {
          .auth-left { display: flex; }
        }
        .auth-left::before {
          content: '';
          position: absolute;
          top: -200px; left: -200px;
          width: 500px; height: 500px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(34,197,94,0.08) 0%, transparent 70%);
          pointer-events: none;
        }
        .auth-left::after {
          content: '';
          position: absolute;
          bottom: -150px; right: -150px;
          width: 400px; height: 400px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(34,197,94,0.05) 0%, transparent 70%);
          pointer-events: none;
        }
        .auth-right {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 32px 24px;
          min-height: 100vh;
        }
        @media (min-width: 768px) {
          .auth-right { max-width: 480px; }
        }
        .auth-form-wrap {
          width: 100%;
          max-width: 400px;
        }
        .auth-card {
          background: #0d1117;
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 20px;
          padding: 36px 32px;
          box-shadow: 0 24px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(34,197,94,0.04);
        }
        .auth-input {
          width: 100%;
          background: #0a1220;
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 10px;
          padding: 11px 14px;
          font-size: 14px;
          color: #f1f5f9;
          transition: border-color 0.15s, box-shadow 0.15s;
          font-family: inherit;
          box-sizing: border-box;
          outline: none;
        }
        .auth-input::placeholder { color: #374151; }
        .auth-input:focus {
          border-color: rgba(34,197,94,0.45);
          box-shadow: 0 0 0 3px rgba(34,197,94,0.08);
        }
        .auth-btn {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 12px 20px;
          background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
          color: #000;
          font-weight: 700;
          font-size: 14px;
          border: none;
          border-radius: 10px;
          cursor: pointer;
          transition: opacity 0.15s, transform 0.15s, box-shadow 0.15s;
          font-family: inherit;
        }
        .auth-btn:hover:not(:disabled) {
          opacity: 0.9;
          transform: translateY(-1px);
          box-shadow: 0 6px 20px rgba(34,197,94,0.3);
        }
        .auth-btn:disabled { opacity: 0.45; cursor: not-allowed; }
        .auth-label {
          display: block;
          font-size: 12px;
          font-weight: 600;
          color: #64748b;
          letter-spacing: 0.02em;
          margin-bottom: 7px;
          text-transform: uppercase;
        }
        .feature-row {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 14px 16px;
          border-radius: 12px;
          background: rgba(34,197,94,0.04);
          border: 1px solid rgba(34,197,94,0.1);
        }
        .stat-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
        }
        .stat-box {
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 12px;
          padding: 14px 12px;
          text-align: center;
        }
        .spin { animation: spin 1s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
        @media (max-width: 767px) { .mobile-brand-text { display: none; } }
      `}</style>

      <div className="auth-root">
        {/* ── LEFT PANEL ─────────────────────────────────────────────── */}
        <div className="auth-left">
          <div style={{ position: 'relative', zIndex: 1 }}>
            {/* Logo */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 56 }}>
              <Image src="/logo.png" alt="SMSGate" width={52} height={52} style={{ borderRadius: 14 }} />
              <div>
                <div style={{ fontWeight: 800, fontSize: 20, color: '#f1f5f9', letterSpacing: '-0.03em' }}>SMSGate</div>
                <div style={{ fontSize: 11, color: '#22c55e', letterSpacing: '0.06em', fontWeight: 600 }}>SMS GATEWAY</div>
              </div>
            </div>

            {/* Headline */}
            <h2 style={{ fontSize: 30, fontWeight: 900, color: '#f1f5f9', lineHeight: 1.2, marginBottom: 12, letterSpacing: '-0.04em' }}>
              Turn any Android<br />
              into an{' '}
              <span style={{ color: '#22c55e' }}>SMS gateway</span>
            </h2>
            <p style={{ fontSize: 14, color: '#475569', lineHeight: 1.7, marginBottom: 40 }}>
              Send millions of SMS via REST API at a fraction of the cost of traditional providers. No SIM card limits, no per-message fees.
            </p>

            {/* Features */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 48 }}>
              {FEATURES.map(({ icon: Icon, text }) => (
                <div key={text} className="feature-row">
                  <div style={{
                    width: 34, height: 34, borderRadius: 9,
                    background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  }}>
                    <Icon size={16} color="#22c55e" />
                  </div>
                  <span style={{ fontSize: 14, color: '#94a3b8', fontWeight: 500 }}>{text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Stats */}
          <div style={{ position: 'relative', zIndex: 1 }}>
            <div className="stat-grid">
              {STATS.map(s => (
                <div key={s.label} className="stat-box">
                  <div style={{ fontSize: 18, fontWeight: 900, color: '#22c55e', letterSpacing: '-0.02em', marginBottom: 4 }}>{s.value}</div>
                  <div style={{ fontSize: 11, color: '#475569', fontWeight: 500 }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── RIGHT PANEL ────────────────────────────────────────────── */}
        <div className="auth-right">
          <div className="auth-form-wrap">
            {/* Mobile logo */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 32 }}>
              <Image src="/logo.png" alt="SMSGate" width={48} height={48} style={{ borderRadius: 13 }} />
              <span className="mobile-brand-text" style={{ fontWeight: 800, fontSize: 18, color: '#f1f5f9', letterSpacing: '-0.03em' }}>SMSGate</span>
            </div>

            <div className="auth-card">
              {/* Header */}
              <div style={{ marginBottom: 28 }}>
                <h1 style={{ fontSize: 24, fontWeight: 800, color: '#f1f5f9', letterSpacing: '-0.04em', marginBottom: 6 }}>
                  Welcome back
                </h1>
                <p style={{ fontSize: 13, color: '#475569' }}>Sign in to your SMSGate account</p>
              </div>

              {/* Error */}
              {error && (
                <div style={{
                  display: 'flex', alignItems: 'flex-start', gap: 10,
                  background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)',
                  borderRadius: 10, padding: '12px 14px', marginBottom: 20,
                }}>
                  <AlertCircle size={14} color="#f87171" style={{ marginTop: 1, flexShrink: 0 }} />
                  <span style={{ fontSize: 13, color: '#f87171' }}>{error}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                {/* Email */}
                <div>
                  <label className="auth-label">Email address</label>
                  <input
                    className="auth-input"
                    type="email" required value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="you@example.com"
                  />
                </div>

                {/* Password */}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 7 }}>
                    <label className="auth-label" style={{ margin: 0 }}>Password</label>
                    <Link href="/forgot-password" style={{ fontSize: 12, color: '#475569', textDecoration: 'none' }}>
                      Forgot password?
                    </Link>
                  </div>
                  <div style={{ position: 'relative' }}>
                    <input
                      className="auth-input"
                      type={show ? 'text' : 'password'} required value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="••••••••"
                      style={{ paddingRight: 44 }}
                    />
                    <button
                      type="button"
                      onClick={() => setShow(s => !s)}
                      style={{
                        position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)',
                        background: 'none', border: 'none', cursor: 'pointer',
                        color: '#374151', padding: 2, display: 'flex',
                      }}
                    >
                      {show ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>

                <button type="submit" disabled={loading} className="auth-btn" style={{ marginTop: 4 }}>
                  {loading
                    ? <><Loader2 size={15} className="spin" /> Signing in…</>
                    : <>Sign in <ArrowRight size={15} /></>
                  }
                </button>
              </form>

              {/* Divider */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '24px 0' }}>
                <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.06)' }} />
                <span style={{ fontSize: 11, color: '#374151', fontWeight: 500 }}>OR</span>
                <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.06)' }} />
              </div>

              <p style={{ textAlign: 'center', fontSize: 13, color: '#475569' }}>
                No account yet?{' '}
                <Link href="/register" style={{ color: '#22c55e', fontWeight: 600, textDecoration: 'none' }}>
                  Create one free →
                </Link>
              </p>
            </div>

            <p style={{ textAlign: 'center', fontSize: 11, color: '#1e293b', marginTop: 24 }}>
              By signing in you agree to our Terms of Service and Privacy Policy.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
