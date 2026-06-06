'use client';
import { useEffect, useState } from 'react';
import { getToken } from '@/lib/auth';
import { api } from '@/lib/api';
import { MessageSquare, Smartphone, Key, Zap, ArrowRight, TrendingUp } from 'lucide-react';
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
  const pct      = plan.smsLimit > 0 ? Math.min(100, (plan.smsUsed / plan.smsLimit) * 100) : 0;
  const nearLimit = pct >= 80;

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-bold text-white">
            Good to see you, <span className="gradient-text">{user.name.split(' ')[0]}</span>
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">Here&apos;s your gateway at a glance.</p>
        </div>
        <span className="text-xs px-3 py-1 rounded-full border font-semibold capitalize" style={{
          background: 'var(--green-subtle)',
          borderColor: 'rgba(34,197,94,0.2)',
          color: '#4ade80',
        }}>
          {user.plan} plan
        </span>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard icon={<MessageSquare size={15} />} color="green"  label="SMS Used"    value={plan.smsUsed.toLocaleString()} />
        <StatCard icon={<Zap size={15} />}           color="yellow" label="Remaining"   value={plan.smsRemaining === null ? '∞' : plan.smsRemaining.toLocaleString()} />
        <StatCard icon={<Smartphone size={15} />}    color="blue"   label="Devices"     value={deviceCount} href="/dashboard/devices" />
        <StatCard icon={<Key size={15} />}           color="purple" label="API Keys"    value={apiKeyCount}  href="/dashboard/keys" />
      </div>

      {/* Usage bar */}
      {plan.smsLimit > 0 && (
        <div className="rounded-2xl border p-5" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <TrendingUp size={15} className={nearLimit ? 'text-red-400' : 'text-green-400'} />
              <span className="text-sm font-medium text-white">Monthly Usage</span>
            </div>
            <span className={`text-sm font-bold ${nearLimit ? 'text-red-400' : 'text-white'}`}>
              {plan.smsUsed.toLocaleString()} <span className="text-gray-600 font-normal">/ {plan.smsLimit.toLocaleString()}</span>
            </span>
          </div>
          <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--bg-raised)' }}>
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${pct}%`, background: nearLimit ? '#ef4444' : 'linear-gradient(90deg, #22c55e, #4ade80)' }}
            />
          </div>
          <div className="flex items-center justify-between mt-2">
            <p className="text-xs text-gray-600">Resets {new Date(plan.resetsAt).toLocaleDateString()}</p>
            {nearLimit && (
              <Link href="/dashboard/billing" className="text-xs text-green-400 hover:text-green-300 flex items-center gap-1 transition-colors">
                Upgrade <ArrowRight size={10} />
              </Link>
            )}
          </div>
        </div>
      )}

      {/* Quick actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <QuickAction
          href="/dashboard/send"
          title="Send SMS"
          desc="Send a message through your gateway right now"
          color="green"
        />
        <QuickAction
          href="/dashboard/keys"
          title="Create API Key"
          desc="Authenticate your app to the REST API"
          color="purple"
        />
      </div>

      {/* Quick start */}
      <div className="rounded-2xl border p-5" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
        <h3 className="text-sm font-semibold text-white mb-4">Quick Start</h3>
        <ol className="space-y-2.5 text-sm mb-4">
          {[
            { n: 1, text: <>Go to <Link href="/dashboard/devices" className="text-white underline underline-offset-2 hover:text-green-400 transition-colors">Devices</Link> — add your Android phone</> },
            { n: 2, text: <>Go to <Link href="/dashboard/keys"    className="text-white underline underline-offset-2 hover:text-green-400 transition-colors">API Keys</Link> — create a key for your app</> },
            { n: 3, text: 'Call the REST API to send SMS' },
          ].map(({ n, text }) => (
            <li key={n} className="flex gap-3 text-gray-500">
              <span className="text-green-400 font-bold shrink-0">{n}.</span>
              <span>{text}</span>
            </li>
          ))}
        </ol>
        <pre className="rounded-xl p-4 text-xs text-green-300 overflow-x-auto font-mono" style={{ background: 'var(--bg-raised)' }}>
{`curl -X POST ${process.env.NEXT_PUBLIC_API_URL ?? 'https://your-server.com'}/api/v1/messages \\
  -H "Authorization: Bearer YOUR_KEY" \\
  -d '{"message":"Hello!","phoneNumbers":["+233244000000"]}'`}
        </pre>
      </div>
    </div>
  );
}

const COLOR: Record<string, { icon: string; bg: string; border: string }> = {
  green:  { icon: 'text-green-400',  bg: 'bg-green-500/10',  border: 'border-green-500/20' },
  yellow: { icon: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/20' },
  blue:   { icon: 'text-blue-400',   bg: 'bg-blue-500/10',   border: 'border-blue-500/20' },
  purple: { icon: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/20' },
};

function StatCard({ icon, color, label, value, href }: { icon: React.ReactNode; color: string; label: string; value: any; href?: string }) {
  const c = COLOR[color];
  const content = (
    <div className="rounded-2xl border p-4 transition-all card-hover" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
      <div className={`w-8 h-8 rounded-lg ${c.bg} border ${c.border} flex items-center justify-center mb-3`}>
        <span className={c.icon}>{icon}</span>
      </div>
      <p className="text-2xl font-black text-white">{value}</p>
      <p className="text-xs text-gray-500 mt-0.5">{label}</p>
    </div>
  );
  if (href) return <Link href={href} className="block">{content}</Link>;
  return content;
}

function QuickAction({ href, title, desc, color }: { href: string; title: string; desc: string; color: string }) {
  const c = COLOR[color];
  return (
    <Link href={href} className={`flex items-start gap-3 rounded-2xl border p-4 transition-all card-hover group`} style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
      <div className={`w-8 h-8 rounded-lg ${c.bg} border ${c.border} flex items-center justify-center shrink-0 mt-0.5`}>
        <ArrowRight size={13} className={`${c.icon} group-hover:translate-x-0.5 transition-transform`} />
      </div>
      <div>
        <p className="text-sm font-semibold text-white">{title}</p>
        <p className="text-xs text-gray-500 mt-0.5">{desc}</p>
      </div>
    </Link>
  );
}

function OverviewSkeleton() {
  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div><Skeleton className="h-6 w-48 mb-2" /><Skeleton className="h-4 w-32" /></div>
        <Skeleton className="h-6 w-20 rounded-full" />
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="rounded-2xl border p-4" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
            <Skeleton className="w-8 h-8 rounded-lg mb-3" />
            <Skeleton className="h-7 w-12 mb-1" />
            <Skeleton className="h-3 w-16" />
          </div>
        ))}
      </div>
      <div className="rounded-2xl border p-5" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
        <Skeleton className="h-4 w-40 mb-3" />
        <Skeleton className="h-1.5 w-full mb-2" />
        <Skeleton className="h-3 w-24" />
      </div>
    </div>
  );
}
