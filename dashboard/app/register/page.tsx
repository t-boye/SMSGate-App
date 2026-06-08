'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import { setToken, setUser } from '@/lib/auth';
import Image from 'next/image';
import { AlertCircle, ArrowRight, Loader2, Eye, EyeOff, Check } from 'lucide-react';

const PERKS = [
  { text: '100 free SMS every month', highlight: '100 free SMS' },
  { text: 'REST API with full documentation', highlight: 'REST API' },
  { text: 'AES-256 end-to-end encryption', highlight: 'AES-256' },
  { text: 'Real-time delivery webhooks', highlight: 'webhooks' },
  { text: 'Multi-device management', highlight: 'Multi-device' },
  { text: 'No credit card required', highlight: 'No credit card' },
];

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm]       = useState({ name: '', email: '', password: '' });
  const [show, setShow]       = useState(false);
  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      const data = await api.register(form);
      setToken(data.token);
      setUser(data.user);
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message ?? 'Registration failed');
    } finally {
      setLoading(false);
    }
  }

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

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
          top: -180px; left: -180px;
          width: 450px; height: 450px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(34,197,94,0.09) 0%, transparent 70%);
          pointer-events: none;
        }
        .auth-right {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 32px 24px;
          min-height: 100vh;
          overflow-y: auto;
        }
        @media (min-width: 768px) {
          .auth-right { max-width: 520px; }
        }
        .auth-form-wrap {
          width: 100%;
          max-width: 420px;
          padding: 16px 0;
        }
        .auth-card {
          background: #0d1117;
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 20px;
          padding: 32px 28px;
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
        .perk-row {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 14px;
          border-radius: 10px;
          transition: background 0.15s;
        }
        .perk-row:hover { background: rgba(34,197,94,0.04); }
        .spin { animation: spin 1s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
        @media (max-width: 767px) { .mobile-brand-text { display: none; } }
        .plan-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: rgba(34,197,94,0.08);
          border: 1px solid rgba(34,197,94,0.2);
          border-radius: 999px;
          padding: 4px 12px;
          font-size: 12px;
          font-weight: 600;
          color: #22c55e;
          margin-bottom: 24px;
        }
        .strength-bar {
          height: 3px;
          border-radius: 999px;
          background: rgba(255,255,255,0.06);
          margin-top: 8px;
          overflow: hidden;
        }
        .strength-fill {
          height: 100%;
          border-radius: 999px;
          transition: width 0.3s, background 0.3s;
        }
      `}</style>

      <div className="auth-root">
        {/* ── LEFT PANEL ─────────────────────────────────────────────── */}
        <div className="auth-left">
          <div style={{ position: 'relative', zIndex: 1 }}>
            {/* Logo */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 52 }}>
              <Image src="/logo.png" alt="SMSGate" width={52} height={52} style={{ borderRadius: 14 }} />
              <div>
                <div style={{ fontWeight: 800, fontSize: 20, color: '#f1f5f9', letterSpacing: '-0.03em' }}>SMSGate</div>
                <div style={{ fontSize: 11, color: '#22c55e', letterSpacing: '0.06em', fontWeight: 600 }}>SMS GATEWAY</div>
              </div>
            </div>

            {/* Headline */}
            <h2 style={{ fontSize: 28, fontWeight: 900, color: '#f1f5f9', lineHeight: 1.2, marginBottom: 10, letterSpacing: '-0.04em' }}>
              Start for free.<br />
              <span style={{ color: '#22c55e' }}>Scale without limits.</span>
            </h2>
            <p style={{ fontSize: 14, color: '#475569', lineHeight: 1.7, marginBottom: 36 }}>
              Join developers and businesses who use SMSGate to power their SMS at 95% less than traditional providers.
            </p>

            {/* Perks list */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {PERKS.map(perk => (
                <div key={perk.text} className="perk-row">
                  <div style={{
                    width: 22, height: 22, borderRadius: 999,
                    background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.25)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  }}>
                    <Check size={11} color="#22c55e" />
                  </div>
                  <span style={{ fontSize: 14, color: '#94a3b8' }}>{perk.text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom quote */}
          <div style={{
            position: 'relative', zIndex: 1,
            background: 'rgba(34,197,94,0.04)',
            border: '1px solid rgba(34,197,94,0.1)',
            borderRadius: 14, padding: '20px 20px',
          }}>
            <p style={{ fontSize: 13, color: '#64748b', lineHeight: 1.6, fontStyle: 'italic', marginBottom: 12 }}>
              "We cut our SMS costs by 90% and got better delivery rates. Setup took less than 10 minutes."
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                width: 32, height: 32, borderRadius: 999,
                background: 'linear-gradient(135deg, #22c55e, #16a34a)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 14, fontWeight: 700, color: '#000',
              }}>K</div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#94a3b8' }}>Kwame A.</div>
                <div style={{ fontSize: 11, color: '#374151' }}>Software Engineer, Accra</div>
              </div>
            </div>
          </div>
        </div>

        {/* ── RIGHT PANEL ────────────────────────────────────────────── */}
        <div className="auth-right">
          <div className="auth-form-wrap">
            {/* Mobile logo */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 28 }}>
              <Image src="/logo.png" alt="SMSGate" width={48} height={48} style={{ borderRadius: 13 }} />
              <span className="mobile-brand-text" style={{ fontWeight: 800, fontSize: 18, color: '#f1f5f9', letterSpacing: '-0.03em' }}>SMSGate</span>
            </div>

            {/* Free plan badge */}
            <div style={{ textAlign: 'center', marginBottom: 4 }}>
              <span className="plan-badge">
                <Check size={11} /> Free plan — no credit card needed
              </span>
            </div>

            <div className="auth-card">
              <div style={{ marginBottom: 24 }}>
                <h1 style={{ fontSize: 22, fontWeight: 800, color: '#f1f5f9', letterSpacing: '-0.04em', marginBottom: 5 }}>
                  Create your account
                </h1>
                <p style={{ fontSize: 13, color: '#475569' }}>Takes under a minute to get started</p>
              </div>

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

              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <label className="auth-label">Full name</label>
                  <input
                    className="auth-input"
                    type="text" required value={form.name}
                    onChange={set('name')} placeholder="Your full name"
                  />
                </div>

                <div>
                  <label className="auth-label">Email address</label>
                  <input
                    className="auth-input"
                    type="email" required value={form.email}
                    onChange={set('email')} placeholder="you@example.com"
                  />
                </div>

                <div>
                  <label className="auth-label">Password</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      className="auth-input"
                      type={show ? 'text' : 'password'} required minLength={6}
                      value={form.password} onChange={set('password')}
                      placeholder="Min. 6 characters"
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
                  {/* Password strength indicator */}
                  {form.password.length > 0 && (
                    <div className="strength-bar">
                      <div className="strength-fill" style={{
                        width: form.password.length < 6 ? '25%' : form.password.length < 10 ? '55%' : '90%',
                        background: form.password.length < 6 ? '#ef4444' : form.password.length < 10 ? '#f59e0b' : '#22c55e',
                      }} />
                    </div>
                  )}
                </div>

                <button type="submit" disabled={loading} className="auth-btn" style={{ marginTop: 4 }}>
                  {loading
                    ? <><Loader2 size={15} className="spin" /> Creating account…</>
                    : <>Create free account <ArrowRight size={15} /></>
                  }
                </button>
              </form>

              <p style={{ fontSize: 11, color: '#1e293b', textAlign: 'center', marginTop: 18 }}>
                By registering you agree to our Terms of Service and Privacy Policy.
              </p>
            </div>

            <p style={{ textAlign: 'center', fontSize: 13, color: '#475569', marginTop: 20 }}>
              Already have an account?{' '}
              <Link href="/login" style={{ color: '#22c55e', fontWeight: 600, textDecoration: 'none' }}>
                Sign in →
              </Link>
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
