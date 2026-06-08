'use client';
import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { api } from '@/lib/api';
import { AlertCircle, ArrowRight, Loader2, CheckCircle2 } from 'lucide-react';

export default function ForgotPasswordPage() {
  const [email, setEmail]     = useState('');
  const [sent, setSent]       = useState(false);
  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      await api.forgotPassword(email);
      setSent(true);
    } catch (err: any) {
      setError(err.message ?? 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <style>{`
        html, body { margin: 0; padding: 0; }
        .auth-input {
          width: 100%; background: #0a1220;
          border: 1px solid rgba(255,255,255,0.1); border-radius: 10px;
          padding: 11px 14px; font-size: 14px; color: #f1f5f9;
          transition: border-color 0.15s, box-shadow 0.15s;
          font-family: inherit; box-sizing: border-box; outline: none;
        }
        .auth-input::placeholder { color: #374151; }
        .auth-input:focus {
          border-color: rgba(34,197,94,0.45);
          box-shadow: 0 0 0 3px rgba(34,197,94,0.08);
        }
        .auth-btn {
          width: 100%; display: flex; align-items: center; justify-content: center; gap: 8px;
          padding: 12px 20px; background: linear-gradient(135deg,#22c55e,#16a34a);
          color: #000; font-weight: 700; font-size: 14px; border: none;
          border-radius: 10px; cursor: pointer;
          transition: opacity 0.15s, transform 0.15s, box-shadow 0.15s; font-family: inherit;
        }
        .auth-btn:hover:not(:disabled) { opacity: 0.9; transform: translateY(-1px); box-shadow: 0 6px 20px rgba(34,197,94,0.3); }
        .auth-btn:disabled { opacity: 0.45; cursor: not-allowed; }
        .spin { animation: spin 1s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>

      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#060b14', padding: '24px' }}>
        <div style={{ width: '100%', maxWidth: 400 }}>

          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 32 }}>
            <Image src="/logo.png" alt="SMSGate" width={38} height={38} style={{ borderRadius: 10 }} />
            <span style={{ fontWeight: 800, fontSize: 18, color: '#f1f5f9', letterSpacing: '-0.03em' }}>SMSGate</span>
          </div>

          <div style={{
            background: '#0d1117', border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 20, padding: '36px 32px',
            boxShadow: '0 24px 80px rgba(0,0,0,0.6)',
          }}>
            {sent ? (
              /* ── Success state ── */
              <div style={{ textAlign: 'center' }}>
                <div style={{
                  width: 52, height: 52, borderRadius: 999, margin: '0 auto 16px',
                  background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.25)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <CheckCircle2 size={26} color="#22c55e" />
                </div>
                <h1 style={{ fontSize: 20, fontWeight: 800, color: '#f1f5f9', marginBottom: 8, letterSpacing: '-0.03em' }}>
                  Check your inbox
                </h1>
                <p style={{ fontSize: 14, color: '#475569', lineHeight: 1.7, marginBottom: 24 }}>
                  If <strong style={{ color: '#94a3b8' }}>{email}</strong> is registered,
                  you'll receive a password reset link shortly. Check spam if it doesn't arrive.
                </p>
                <Link href="/login" style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  fontSize: 13, fontWeight: 600, color: '#22c55e', textDecoration: 'none',
                }}>
                  ← Back to sign in
                </Link>
              </div>
            ) : (
              /* ── Form state ── */
              <>
                <div style={{ marginBottom: 24 }}>
                  <h1 style={{ fontSize: 22, fontWeight: 800, color: '#f1f5f9', letterSpacing: '-0.04em', marginBottom: 6 }}>
                    Forgot password?
                  </h1>
                  <p style={{ fontSize: 13, color: '#475569' }}>
                    Enter your email and we'll send you a reset link.
                  </p>
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

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#64748b', letterSpacing: '0.02em', marginBottom: 7, textTransform: 'uppercase' }}>
                      Email address
                    </label>
                    <input
                      className="auth-input"
                      type="email" required value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="you@example.com"
                    />
                  </div>
                  <button type="submit" disabled={loading} className="auth-btn">
                    {loading
                      ? <><Loader2 size={15} className="spin" /> Sending…</>
                      : <>Send reset link <ArrowRight size={15} /></>
                    }
                  </button>
                </form>
              </>
            )}
          </div>

          <p style={{ textAlign: 'center', fontSize: 13, color: '#475569', marginTop: 20 }}>
            Remember it?{' '}
            <Link href="/login" style={{ color: '#22c55e', fontWeight: 600, textDecoration: 'none' }}>
              Sign in →
            </Link>
          </p>
        </div>
      </div>
    </>
  );
}
