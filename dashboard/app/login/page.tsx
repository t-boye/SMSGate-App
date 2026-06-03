'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { api } from '@/lib/api';
import { setToken, setUser } from '@/lib/auth';
import { AlertCircle, ArrowRight, Loader2 } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
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
    <div className="min-h-screen flex" style={{ background: 'var(--bg-base)' }}>
      {/* Left panel */}
      <div className="hidden lg:flex flex-col justify-between w-[400px] shrink-0 p-10 border-r" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
        <div className="flex items-center gap-3">
          <Image src="/logo.png" alt="SMSGate" width={32} height={32} className="rounded-xl" />
          <span className="font-semibold text-white">SMSGate</span>
        </div>
        <div>
          <blockquote className="text-base text-gray-300 leading-relaxed mb-5">
            &ldquo;Turn any Android phone into a programmable SMS gateway — no SIM card rental, no third-party carrier.&rdquo;
          </blockquote>
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-600">
            <span>256-bit encrypted</span>
            <span>Multi-tenant</span>
            <span>REST API</span>
          </div>
        </div>
        <p className="text-xs text-gray-700">&copy; {new Date().getFullYear()} SMSGate</p>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          <div className="flex items-center gap-3 mb-10 lg:hidden">
            <Image src="/logo.png" alt="SMSGate" width={28} height={28} className="rounded-xl" />
            <span className="font-semibold text-white">SMSGate</span>
          </div>

          <h1 className="text-2xl font-bold text-white mb-1">Welcome back</h1>
          <p className="text-sm text-gray-500 mb-7">Sign in to your account</p>

          {error && (
            <div className="flex items-start gap-2.5 rounded-xl px-4 py-3 mb-5 bg-red-500/10 border border-red-500/20">
              <AlertCircle size={15} className="text-red-400 mt-0.5 shrink-0" />
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">Email address</label>
              <input
                type="email" required value={email} onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-600 border focus:outline-none focus:border-green-500/60 transition-colors"
                style={{ background: 'rgba(255,255,255,0.04)', borderColor: 'rgba(255,255,255,0.08)' }}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">Password</label>
              <input
                type="password" required value={password} onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-600 border focus:outline-none focus:border-green-500/60 transition-colors"
                style={{ background: 'rgba(255,255,255,0.04)', borderColor: 'rgba(255,255,255,0.08)' }}
              />
            </div>
            <button
              type="submit" disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-green-500 hover:bg-green-400 disabled:opacity-60 disabled:cursor-not-allowed text-black font-semibold py-2.5 rounded-xl text-sm transition-colors mt-1"
            >
              {loading ? <Loader2 size={15} className="animate-spin" /> : <>Sign In <ArrowRight size={14} /></>}
            </button>
          </form>

          <p className="text-center text-sm text-gray-600 mt-6">
            No account?{' '}
            <Link href="/register" className="text-green-400 hover:text-green-300 font-medium transition-colors">
              Create one free
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
