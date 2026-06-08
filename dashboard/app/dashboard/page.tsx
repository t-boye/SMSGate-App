'use client';
import { useEffect, useState } from 'react';
import { getToken } from '@/lib/auth';
import { api } from '@/lib/api';
import {
  MessageSquare, Smartphone, Key, BarChart2, ArrowRight,
  TrendingUp, Clock, Send, CheckCircle2, AlertCircle, Loader2,
} from 'lucide-react';
import Link from 'next/link';

function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`skeleton ${className}`} />;
}

const STATE_STYLE: Record<string, { dot: string; text: string; bg: string }> = {
  Pending:   { dot: 'bg-yellow-400',  text: 'text-yellow-400',  bg: 'bg-yellow-500/10'  },
  Processed: { dot: 'bg-blue-400',    text: 'text-blue-400',    bg: 'bg-blue-500/10'    },
  Sent:      { dot: 'bg-green-400',   text: 'text-green-400',   bg: 'bg-green-500/10'   },
  Delivered: { dot: 'bg-emerald-300', text: 'text-emerald-300', bg: 'bg-emerald-500/10' },
  Failed:    { dot: 'bg-red-400',     text: 'text-red-400',     bg: 'bg-red-500/10'     },
};

export default function OverviewPage() {
  const [data, setData]         = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');
  const token = getToken()!;

  useEffect(() => {
    if (!token) return;
    Promise.all([
      api.me(token),
      api.messages(token, 5).catch(() => []),
    ])
      .then(([me, msgs]) => { setData(me); setMessages(msgs); })
      .catch(e => setError(e.message ?? 'Failed to load'))
      .finally(() => setLoading(false));
  }, [token]);

  if (loading) return <OverviewSkeleton />;
  if (error)   return <p className="text-red-400 text-sm">{error}</p>;
  if (!data)   return null;

  const { user, plan, deviceCount, apiKeyCount } = data;
  const pct       = plan.smsLimit > 0 ? Math.min(100, (plan.smsUsed / plan.smsLimit) * 100) : 0;
  const nearLimit = pct >= 80;
  const firstName = user.name?.split(' ')[0] ?? 'there';

  return (
    <div className="space-y-6 max-w-5xl">

      {/* ── Header ─────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-bold text-white">
            Good to see you, <span className="gradient-text">{firstName}</span>
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">Here&apos;s your gateway at a glance.</p>
        </div>
        <span
          className="text-xs px-3 py-1 rounded-full border font-bold capitalize"
          style={{ background: 'var(--green-subtle)', borderColor: 'rgba(34,197,94,0.2)', color: '#4ade80' }}
        >
          {user.plan} plan
        </span>
      </div>

      {/* ── Stats grid ─────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          icon={<MessageSquare size={15} />}
          color="green"
          label="SMS Used"
          value={plan.smsUsed.toLocaleString()}
        />
        <StatCard
          icon={<BarChart2 size={15} />}
          color="yellow"
          label="Remaining"
          value={plan.smsRemaining === null ? '∞' : plan.smsRemaining.toLocaleString()}
        />
        <StatCard
          icon={<Smartphone size={15} />}
          color="blue"
          label="Devices"
          value={deviceCount}
          href="/dashboard/devices"
        />
        <StatCard
          icon={<Key size={15} />}
          color="purple"
          label="API Keys"
          value={apiKeyCount}
          href="/dashboard/keys"
        />
      </div>

      {/* ── Usage bar ──────────────────────────────────── */}
      {plan.smsLimit > 0 && (
        <div className="rounded-2xl border p-5" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <TrendingUp size={14} className={nearLimit ? 'text-red-400' : 'text-green-400'} />
              <span className="text-sm font-semibold text-white">Monthly Usage</span>
            </div>
            <span className={`text-sm font-bold ${nearLimit ? 'text-red-400' : 'text-white'}`}>
              {plan.smsUsed.toLocaleString()}
              <span className="text-gray-600 font-normal"> / {plan.smsLimit.toLocaleString()}</span>
            </span>
          </div>
          <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--bg-raised)' }}>
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{
                width: `${pct}%`,
                background: nearLimit
                  ? 'linear-gradient(90deg, #ef4444, #f87171)'
                  : 'linear-gradient(90deg, #16a34a, #22c55e, #4ade80)',
              }}
            />
          </div>
          <div className="flex items-center justify-between mt-2.5">
            <p className="text-xs text-gray-600">
              Resets {new Date(plan.resetsAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
            </p>
            {nearLimit && (
              <Link href="/dashboard/billing" className="text-xs text-green-400 hover:text-green-300 flex items-center gap-1 transition-colors">
                Upgrade plan <ArrowRight size={10} />
              </Link>
            )}
          </div>
        </div>
      )}

      {/* ── Quick actions ───────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <QuickAction href="/dashboard/send"    title="Send SMS"       desc="Send a message through your gateway right now"  color="green" />
        <QuickAction href="/dashboard/devices" title="Manage Devices" desc="View your connected phones and SIM card status" color="blue"  />
      </div>

      {/* ── Bottom two-col ──────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Quick start */}
        <div className="rounded-2xl border p-5" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
          <h3 className="text-sm font-semibold text-white mb-4">Quick Start</h3>
          <ol className="space-y-3 text-sm mb-4">
            {[
              { n: 1, text: <><Link href="/dashboard/devices" className="text-white underline underline-offset-2 hover:text-green-400 transition-colors">Add a device</Link> — your Android phone becomes the gateway</> },
              { n: 2, text: <><Link href="/dashboard/keys"    className="text-white underline underline-offset-2 hover:text-green-400 transition-colors">Create an API key</Link> — use it to authenticate requests</> },
              { n: 3, text: 'Call the API below to send your first SMS' },
            ].map(({ n, text }) => (
              <li key={n} className="flex gap-3 text-gray-500">
                <span className="text-green-400 font-bold shrink-0 text-xs mt-0.5">{n}.</span>
                <span className="leading-relaxed">{text}</span>
              </li>
            ))}
          </ol>
          <pre
            className="rounded-xl p-4 text-xs text-green-300 overflow-x-auto font-mono leading-relaxed"
            style={{ background: 'var(--bg-raised)' }}
          >
{`curl -X POST ${process.env.NEXT_PUBLIC_API_URL ?? 'https://sms-gate-app.vercel.app'}/api/v1/messages \\
  -H "Authorization: Bearer YOUR_KEY" \\
  -d '{"message":"Hello!","phoneNumbers":["+233244000000"]}'`}
          </pre>
        </div>

        {/* Recent messages */}
        <div className="rounded-2xl border p-5" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-white">Recent Messages</h3>
            <Link href="/dashboard/messages" className="text-xs text-green-400 hover:text-green-300 transition-colors flex items-center gap-1">
              View all <ArrowRight size={10} />
            </Link>
          </div>

          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <div className="w-10 h-10 rounded-xl bg-gray-800/60 flex items-center justify-center mb-3">
                <MessageSquare size={18} className="text-gray-600" />
              </div>
              <p className="text-xs text-gray-500 mb-1">No messages yet</p>
              <Link href="/dashboard/send" className="text-xs text-green-400 hover:text-green-300 transition-colors mt-1 flex items-center gap-1">
                Send your first SMS <ArrowRight size={9} />
              </Link>
            </div>
          ) : (
            <div className="space-y-1">
              {messages.slice(0, 5).map((msg: any) => {
                const s = STATE_STYLE[msg.state] ?? STATE_STYLE.Failed;
                return (
                  <div key={msg.id} className="flex items-start gap-3 py-2.5 border-b last:border-0" style={{ borderColor: 'var(--border)' }}>
                    <span className={`mt-1.5 w-1.5 h-1.5 rounded-full shrink-0 ${s.dot}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-white truncate font-medium">{msg.message}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] text-gray-600">
                          {msg.phoneNumbers?.[0]}
                          {msg.phoneNumbers?.length > 1 && ` +${msg.phoneNumbers.length - 1}`}
                        </span>
                        <span className="text-gray-800">·</span>
                        <span className="text-[10px] text-gray-700 flex items-center gap-0.5">
                          <Clock size={8} />
                          {new Date(msg.createdAt).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full shrink-0 ${s.bg} ${s.text}`}>
                      {msg.state}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

    </div>
  );
}

/* ── StatCard ─────────────────────────────────────────── */
const COLOR: Record<string, { icon: string; bg: string; border: string }> = {
  green:  { icon: 'text-green-400',  bg: 'bg-green-500/10',  border: 'border-green-500/20' },
  yellow: { icon: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/20' },
  blue:   { icon: 'text-blue-400',   bg: 'bg-blue-500/10',   border: 'border-blue-500/20' },
  purple: { icon: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/20' },
};

function StatCard({
  icon, color, label, value, href,
}: {
  icon: React.ReactNode; color: string; label: string; value: any; href?: string;
}) {
  const c = COLOR[color];
  const card = (
    <div className="rounded-2xl border p-4 transition-all card-hover" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
      <div className={`w-8 h-8 rounded-lg ${c.bg} border ${c.border} flex items-center justify-center mb-3`}>
        <span className={c.icon}>{icon}</span>
      </div>
      <p className="text-2xl font-black text-white">{value}</p>
      <p className="text-xs text-gray-500 mt-0.5">{label}</p>
    </div>
  );
  if (href) return <Link href={href} className="block">{card}</Link>;
  return card;
}

/* ── QuickAction ──────────────────────────────────────── */
function QuickAction({
  href, title, desc, color,
}: {
  href: string; title: string; desc: string; color: string;
}) {
  const c = COLOR[color];
  return (
    <Link
      href={href}
      className="flex items-start gap-3 rounded-2xl border p-4 transition-all card-hover group"
      style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}
    >
      <div className={`w-9 h-9 rounded-xl ${c.bg} border ${c.border} flex items-center justify-center shrink-0 mt-0.5`}>
        <ArrowRight size={14} className={`${c.icon} group-hover:translate-x-0.5 transition-transform`} />
      </div>
      <div>
        <p className="text-sm font-semibold text-white">{title}</p>
        <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{desc}</p>
      </div>
    </Link>
  );
}

/* ── Skeleton ─────────────────────────────────────────── */
function OverviewSkeleton() {
  return (
    <div className="space-y-6 max-w-5xl">
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
        <Skeleton className="h-2 w-full mb-2" />
        <Skeleton className="h-3 w-24" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {[0, 1].map(i => (
          <div key={i} className="rounded-2xl border p-5" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
            <Skeleton className="h-4 w-28 mb-4" />
            {[...Array(3)].map((_, j) => <Skeleton key={j} className="h-3 w-full mb-3" />)}
          </div>
        ))}
      </div>
    </div>
  );
}
