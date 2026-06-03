'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { api } from '@/lib/api';
import { setToken, setUser } from '@/lib/auth';
import { AlertCircle, ArrowRight, Loader2, Check } from 'lucide-react';

const PERKS = [
  '100 free SMS per month',
  'REST API + webhooks',
  'Multi-device support',
  'End-to-end encryption',
];

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm]     = useState({ name: '', email: '', password: '' });
  const [error, setError]   = useState('');
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

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  return (
    <div className="min-h-screen flex" style={{ background: 'var(--bg-base)' }}>
      {/* Left panel */}
      <div className="hidden lg:flex flex-col justify-between w-[400px] shrink-0 p-10 border-r" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
        <div className="flex items-center gap-3">
          <Image src="/logo.png" alt="SMSGate" width={32} height={32} className="rounded-xl" />
          <span className="font-semibold text-white">SMSGate</span>
        </div>
        <div>
          <h2 className="text-lg font-bold text-white mb-4">Everything you need to send SMS at scale</h2>
          <ul className="space-y-3">
            {PERKS.map(p => (
              <li key={p} className="flex items-center gap-3 text-sm text-gray-400">
                <span className="w-5 h-5 rounded-full bg-green-500/15 border border-green-500/30 flex items-center justify-center shrink-0">
                  <Check size={10} className="text-green-400" />
                </span>
                {p}
              </li>
            ))}
          </ul>
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

          <h1 className="text-2xl font-bold text-white mb-1">Create your account</h1>
          <p className="text-sm text-gray-500 mb-7">Free to start — no credit card required</p>

          {error && (
            <div className="flex items-start gap-2.5 rounded-xl px-4 py-3 mb-5 bg-red-500/10 border border-red-500/20">
              <AlertCircle size={15} className="text-red-400 mt-0.5 shrink-0" />
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {[
              { k: 'name',     label: 'Full name',     type: 'text',     ph: 'Your name' },
              { k: 'email',    label: 'Email address', type: 'email',    ph: 'you@example.com' },
              { k: 'password', label: 'Password',      type: 'password', ph: 'Min 6 characters' },
            ].map(({ k, label, type, ph }) => (
              <div key={k}>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">{label}</label>
                <input
                  type={type} required minLength={k === 'password' ? 6 : undefined}
                  value={(form as any)[k]} onChange={set(k)} placeholder={ph}
                  className="w-full rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-600 border focus:outline-none focus:border-green-500/60 transition-colors"
                  style={{ background: 'rgba(255,255,255,0.04)', borderColor: 'rgba(255,255,255,0.08)' }}
                />
              </div>
            ))}
            <button
              type="submit" disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-green-500 hover:bg-green-400 disabled:opacity-60 disabled:cursor-not-allowed text-black font-semibold py-2.5 rounded-xl text-sm transition-colors mt-1"
            >
              {loading ? <Loader2 size={15} className="animate-spin" /> : <>Create Account <ArrowRight size={14} /></>}
            </button>
          </form>

          <p className="text-center text-sm text-gray-600 mt-6">
            Already have an account?{' '}
            <Link href="/login" className="text-green-400 hover:text-green-300 font-medium transition-colors">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
