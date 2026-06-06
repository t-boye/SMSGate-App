'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { api } from '@/lib/api';
import { setToken, setUser } from '@/lib/auth';
import { AlertCircle, ArrowRight, Loader2, Eye, EyeOff } from 'lucide-react';

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
    <div className="min-h-screen flex items-center justify-center px-5 py-12 relative" style={{ background: 'var(--bg-base)' }}>
      {/* Background glow */}
      <div className="hero-glow pointer-events-none" style={{ top: '20%', left: '50%', transform: 'translateX(-50%)', opacity: 0.6 }} />

      <div className="w-full max-w-md relative z-10">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2.5 mb-10">
          <Image src="/logo.png" alt="SMSGate" width={36} height={36} className="rounded-xl" />
          <span className="text-lg font-bold text-white tracking-tight">SMSGate</span>
        </div>

        {/* Card */}
        <div className="rounded-2xl border p-8" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)', boxShadow: '0 20px 60px rgba(0,0,0,0.5)' }}>
          <div className="mb-7">
            <h1 className="text-2xl font-bold text-white">Welcome back</h1>
            <p className="text-sm text-gray-500 mt-1">Sign in to your SMSGate account</p>
          </div>

          {error && (
            <div className="flex items-start gap-2.5 rounded-xl px-4 py-3 mb-5 border" style={{ background: 'rgba(239,68,68,0.08)', borderColor: 'rgba(239,68,68,0.2)' }}>
              <AlertCircle size={15} className="text-red-400 mt-0.5 shrink-0" />
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">Email address</label>
              <input
                type="email" required value={email} onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={show ? 'text' : 'password'} required value={password} onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="input-field pr-10"
                />
                <button type="button" onClick={() => setShow(s => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 hover:text-gray-300 transition-colors">
                  {show ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full mt-2">
              {loading
                ? <><Loader2 size={15} className="animate-spin" /> Signing in…</>
                : <>Sign in <ArrowRight size={14} /></>
              }
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-gray-600 mt-5">
          No account?{' '}
          <Link href="/register" className="text-green-400 hover:text-green-300 font-medium transition-colors">
            Create one free
          </Link>
        </p>
      </div>
    </div>
  );
}
