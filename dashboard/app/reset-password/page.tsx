'use client';
import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { api } from '@/lib/api';
import { AlertCircle, ArrowRight, Loader2, Eye, EyeOff, CheckCircle2 } from 'lucide-react';

function ResetForm() {
  const router       = useRouter();
  const params       = useSearchParams();
  const token        = params.get('token') ?? '';

  const [password, setPassword] = useState('');
  const [confirm, setConfirm]   = useState('');
  const [show, setShow]         = useState(false);
  const [done, setDone]         = useState(false);
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);

  useEffect(() => {
    if (!token) setError('Invalid or missing reset token. Request a new link.');
  }, [token]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirm) { setError('Passwords do not match'); return; }
    setError(''); setLoading(true);
    try {
      await api.resetPassword(token, password);
      setDone(true);
      setTimeout(() => router.push('/login'), 3000);
    } catch (err: any) {
      setError(err.message ?? 'Reset failed — the link may have expired');
    } finally {
      setLoading(false);
    }
  }

  const strength = password.length === 0 ? 0 : password.length < 6 ? 1 : password.length < 10 ? 2 : 3;
  const strengthColor = ['transparent', '#ef4444', '#f59e0b', '#22c55e'][strength];
  const strengthWidth = ['0%', '25%', '60%', '100%'][strength];

  return (
    <div style={{
      background: '#0d1117', border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: 20, padding: '36px 32px',
      boxShadow: '0 24px 80px rgba(0,0,0,0.6)',
    }}>
      {done ? (
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: 52, height: 52, borderRadius: 999, margin: '0 auto 16px',
            background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.25)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <CheckCircle2 size={26} color="#22c55e" />
          </div>
          <h1 style={{ fontSize: 20, fontWeight: 800, color: '#f1f5f9', marginBottom: 8 }}>Password updated!</h1>
          <p style={{ fontSize: 14, color: '#475569', marginBottom: 0 }}>
            Redirecting you to sign in…
          </p>
        </div>
      ) : (
        <>
          <div style={{ marginBottom: 24 }}>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: '#f1f5f9', letterSpacing: '-0.04em', marginBottom: 6 }}>
              Set new password
            </h1>
            <p style={{ fontSize: 13, color: '#475569' }}>Choose a strong password for your account.</p>
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
                New password
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  className="auth-input"
                  type={show ? 'text' : 'password'} required minLength={6}
                  value={password} onChange={e => setPassword(e.target.value)}
                  placeholder="Min. 6 characters" style={{ paddingRight: 44 }}
                  disabled={!token}
                />
                <button type="button" onClick={() => setShow(s => !s)} style={{
                  position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', cursor: 'pointer', color: '#374151', padding: 2, display: 'flex',
                }}>
                  {show ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
              {password.length > 0 && (
                <div style={{ height: 3, borderRadius: 999, background: 'rgba(255,255,255,0.06)', marginTop: 8, overflow: 'hidden' }}>
                  <div style={{ height: '100%', borderRadius: 999, width: strengthWidth, background: strengthColor, transition: 'width 0.3s, background 0.3s' }} />
                </div>
              )}
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#64748b', letterSpacing: '0.02em', marginBottom: 7, textTransform: 'uppercase' }}>
                Confirm password
              </label>
              <input
                className="auth-input"
                type={show ? 'text' : 'password'} required
                value={confirm} onChange={e => setConfirm(e.target.value)}
                placeholder="Repeat your password"
                disabled={!token}
                style={{
                  borderColor: confirm && confirm !== password ? 'rgba(239,68,68,0.4)' : undefined,
                }}
              />
              {confirm && confirm !== password && (
                <p style={{ fontSize: 11, color: '#ef4444', marginTop: 5 }}>Passwords do not match</p>
              )}
            </div>

            <button type="submit" disabled={loading || !token || password !== confirm} className="auth-btn" style={{ marginTop: 4 }}>
              {loading
                ? <><Loader2 size={15} className="spin" /> Updating…</>
                : <>Update password <ArrowRight size={15} /></>
              }
            </button>
          </form>
        </>
      )}
    </div>
  );
}

export default function ResetPasswordPage() {
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
        .auth-input:focus { border-color: rgba(34,197,94,0.45); box-shadow: 0 0 0 3px rgba(34,197,94,0.08); }
        .auth-input:disabled { opacity: 0.4; cursor: not-allowed; }
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
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 32 }}>
            <Image src="/logo.png" alt="SMSGate" width={38} height={38} style={{ borderRadius: 10 }} />
            <span style={{ fontWeight: 800, fontSize: 18, color: '#f1f5f9', letterSpacing: '-0.03em' }}>SMSGate</span>
          </div>

          <Suspense fallback={
            <div style={{ background: '#0d1117', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 20, padding: '36px 32px', textAlign: 'center', color: '#475569', fontSize: 14 }}>
              Loading…
            </div>
          }>
            <ResetForm />
          </Suspense>

          <p style={{ textAlign: 'center', fontSize: 13, color: '#475569', marginTop: 20 }}>
            <Link href="/login" style={{ color: '#22c55e', fontWeight: 600, textDecoration: 'none' }}>
              ← Back to sign in
            </Link>
          </p>
        </div>
      </div>
    </>
  );
}
