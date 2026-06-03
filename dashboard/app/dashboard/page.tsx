'use client';
import { useEffect, useState } from 'react';
import { getToken } from '@/lib/auth';
import { api } from '@/lib/api';
import { MessageSquare, Smartphone, Key, Zap, ArrowRight } from 'lucide-react';
import Link from 'next/link';

function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`skeleton ${className}`} />;
}

export default function OverviewPage() {
  const [data, setData]       = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');

  useEffect(() => {
    const token = getToken();
    if (!token) return;
    api.me(token)
      .then(setData)
      .catch(e => setError(e.message ?? 'Failed to load'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <OverviewSkeleton />;
  if (error)   return <p className="text-red-400 text-sm">{error}</p>;
  if (!data)   return null;

  const { user, plan, deviceCount, apiKeyCount } = data;
  const pct     = plan.smsLimit > 0 ? Math.min(100, (plan.smsUsed / plan.smsLimit) * 100) : 0;
  const nearLimit = pct >= 80;

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-white">Overview</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Welcome back, <span className="text-gray-300">{user.name}</span>
          </p>
        </div>
        <span className="text-xs px-2.5 py-1 rounded-full bg-green-500/10 border border-green-500/20 text-green-400 font-medium capitalize">
          {user.plan} plan
        </span>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard icon={<MessageSquare size={16} className="text-green-400" />}   label="SMS Used"      value={plan.smsUsed.toLocaleString()} />
        <StatCard icon={<Zap size={16}           className="text-yellow-400" />}  label="Remaining"     value={plan.smsRemaining === null ? '∞' : plan.smsRemaining.toLocaleString()} />
        <StatCard icon={<Smartphone size={16}    className="text-blue-400" />}    label="Devices"       value={deviceCount} href="/dashboard/devices" />
        <StatCard icon={<Key size={16}           className="text-purple-400" />}  label="API Keys"      value={apiKeyCount}  href="/dashboard/keys" />
      </div>

      {/* Usage bar */}
      {plan.smsLimit > 0 && (
        <Card>
          <div className="flex items-center justify-between text-sm mb-3">
            <span className="text-gray-400 font-medium">Monthly Usage</span>
            <span className={`font-semibold ${nearLimit ? 'text-red-400' : 'text-white'}`}>
              {plan.smsUsed.toLocaleString()} / {plan.smsLimit.toLocaleString()}
            </span>
          </div>
          <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--bg-raised)' }}>
            <div
              className={`h-full rounded-full transition-all ${nearLimit ? 'bg-red-500' : 'bg-green-500'}`}
              style={{ width: `${pct}%` }}
            />
          </div>
          <div className="flex items-center justify-between mt-2">
            <p className="text-xs text-gray-600">Resets {new Date(plan.resetsAt).toLocaleDateString()}</p>
            {nearLimit && (
              <Link href="/dashboard/billing" className="text-xs text-green-400 hover:text-green-300 flex items-center gap-1">
                Upgrade <ArrowRight size={10} />
              </Link>
            )}
          </div>
        </Card>
      )}

      {/* Quick start */}
      <Card>
        <h3 className="text-sm font-semibold text-white mb-4">Quick Start</h3>
        <ol className="space-y-3 text-sm">
          <li className="flex gap-3 text-gray-400">
            <span className="text-green-400 font-bold shrink-0">1.</span>
            Go to <Link href="/dashboard/devices" className="text-white hover:text-green-400 underline underline-offset-2">Devices</Link> — add your Android phone
          </li>
          <li className="flex gap-3 text-gray-400">
            <span className="text-green-400 font-bold shrink-0">2.</span>
            Go to <Link href="/dashboard/keys" className="text-white hover:text-green-400 underline underline-offset-2">API Keys</Link> — create a key for your app
          </li>
          <li className="flex gap-3 text-gray-400">
            <span className="text-green-400 font-bold shrink-0">3.</span>
            Send your first SMS via the API
          </li>
        </ol>
        <pre className="mt-4 rounded-xl p-4 text-xs text-green-300 overflow-x-auto" style={{ background: 'var(--bg-raised)' }}>{`curl -X POST ${process.env.NEXT_PUBLIC_API_URL ?? 'https://sms-gate-app.vercel.app'}/api/v1/messages \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"message":"Hello!","phoneNumbers":["+233244000000"]}'`}</pre>
      </Card>
    </div>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-2xl p-5 border" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
      {children}
    </div>
  );
}

function StatCard({ icon, label, value, href }: { icon: React.ReactNode; label: string; value: any; href?: string }) {
  const content = (
    <div className="rounded-2xl p-4 border transition-colors" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <span className="text-xs text-gray-500">{label}</span>
      </div>
      <p className="text-2xl font-bold text-white">{value}</p>
    </div>
  );
  if (href) return <Link href={href} className="block hover:border-white/10 rounded-2xl">{content}</Link>;
  return content;
}

function OverviewSkeleton() {
  return (
    <div className="space-y-6 max-w-4xl">
      <div><Skeleton className="h-6 w-32 mb-2" /><Skeleton className="h-4 w-48" /></div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="rounded-2xl p-4 border" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
            <Skeleton className="h-4 w-20 mb-3" />
            <Skeleton className="h-7 w-12" />
          </div>
        ))}
      </div>
      <div className="rounded-2xl p-5 border" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
        <Skeleton className="h-4 w-40 mb-3" />
        <Skeleton className="h-2 w-full mb-2" />
        <Skeleton className="h-3 w-24" />
      </div>
    </div>
  );
}
