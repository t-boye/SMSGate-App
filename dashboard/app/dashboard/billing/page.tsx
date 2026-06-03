'use client';
import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { getToken } from '@/lib/auth';
import { api } from '@/lib/api';
import { Check, Zap, AlertCircle } from 'lucide-react';

function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`skeleton ${className}`} />;
}

function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl border ${className}`} style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
      {children}
    </div>
  );
}

const FEATURES: Record<string, string[]> = {
  free:     ['100 SMS / month', '1 device', '1 API key', 'Community support'],
  basic:    ['5,000 SMS / month', 'Up to 3 devices', '5 API keys', 'Email support'],
  pro:      ['30,000 SMS / month', 'Up to 10 devices', 'Unlimited API keys', 'Priority support'],
  business: ['Unlimited SMS', 'Unlimited devices', 'Unlimited API keys', 'Dedicated support'],
};

export default function BillingPage() {
  return (
    <Suspense fallback={
      <div className="space-y-5 max-w-4xl">
        <div><Skeleton className="h-6 w-40 mb-2" /><Skeleton className="h-4 w-64" /></div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-64 rounded-2xl" />)}
        </div>
      </div>
    }>
      <BillingInner />
    </Suspense>
  );
}

function BillingInner() {
  const [plans, setPlans]     = useState<any[]>([]);
  const [usage, setUsage]     = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying]   = useState<string | null>(null);
  const [error, setError]     = useState('');
  const searchParams = useSearchParams();
  const status = searchParams.get('status');
  const token  = getToken()!;

  useEffect(() => {
    Promise.all([api.plans(), api.usage(token)])
      .then(([p, u]) => { setPlans(p); setUsage(u); })
      .catch(e => setError(e.message ?? 'Failed to load plans'))
      .finally(() => setLoading(false));
  }, []);

  async function upgrade(planId: string) {
    setPaying(planId);
    try {
      const { authorizationUrl } = await api.initializePayment(token, planId);
      window.location.href = authorizationUrl;
    } catch (err: any) {
      setError(err.message ?? 'Payment initialization failed');
      setPaying(null);
    }
  }

  const pct = usage?.smsLimit > 0 ? Math.min(100, (usage.smsUsed / usage.smsLimit) * 100) : 0;

  if (loading) return (
    <div className="space-y-5 max-w-4xl">
      <div><Skeleton className="h-6 w-40 mb-2" /><Skeleton className="h-4 w-64" /></div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-64 rounded-2xl" />)}
      </div>
    </div>
  );

  return (
    <div className="max-w-4xl space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold text-white">Billing &amp; Plans</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Current plan: <span className="text-green-400 font-medium capitalize">{usage?.plan ?? '—'}</span>
          {usage?.smsLimit > 0 && ` · ${usage.smsUsed.toLocaleString()} / ${usage.smsLimit.toLocaleString()} SMS used`}
        </p>
      </div>

      {/* Usage bar (if on a paid plan) */}
      {usage?.smsLimit > 0 && (
        <Card className="p-5">
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-gray-400">Monthly SMS usage</span>
            <span className={`font-medium ${pct >= 80 ? 'text-red-400' : 'text-white'}`}>
              {usage.smsUsed.toLocaleString()} / {usage.smsLimit.toLocaleString()}
            </span>
          </div>
          <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--bg-raised)' }}>
            <div className={`h-full rounded-full ${pct >= 80 ? 'bg-red-500' : 'bg-green-500'}`} style={{ width: `${pct}%` }} />
          </div>
          <p className="text-xs text-gray-600 mt-1.5">Resets {new Date(usage.resetsAt).toLocaleDateString()}</p>
        </Card>
      )}

      {/* Status banners */}
      {status === 'success' && (
        <div className="flex items-center gap-3 rounded-xl px-4 py-3 bg-green-500/10 border border-green-500/20 text-green-400 text-sm">
          <Check size={16} /> Payment successful — your plan has been upgraded.
        </div>
      )}
      {status === 'failed' && (
        <div className="flex items-center gap-3 rounded-xl px-4 py-3 bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
          <AlertCircle size={16} /> Payment was not completed. Please try again.
        </div>
      )}
      {error && (
        <div className="flex items-center gap-3 rounded-xl px-4 py-3 bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
          <AlertCircle size={16} /> {error}
        </div>
      )}

      {/* Plan cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {plans.map((plan: any) => {
          const isCurrent = usage?.plan === plan.id;
          const features  = FEATURES[plan.id] ?? [];
          return (
            <div
              key={plan.id}
              className={`rounded-2xl p-5 flex flex-col gap-4 border transition-colors ${
                isCurrent
                  ? 'border-green-500/50'
                  : 'hover:border-white/10'
              }`}
              style={{ background: 'var(--bg-surface)', borderColor: isCurrent ? undefined : 'var(--border)' }}
            >
              {isCurrent && (
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-green-500/15 border border-green-500/30 text-green-400 self-start tracking-wide uppercase">
                  Current
                </span>
              )}
              <div>
                <h3 className="font-semibold text-white">{plan.name}</h3>
                <p className="text-2xl font-bold text-white mt-1">
                  {plan.price === 0 ? 'Free' : `GHS ${plan.priceGhs}`}
                  {plan.price > 0 && <span className="text-sm text-gray-500 font-normal"> /mo</span>}
                </p>
                {plan.price > 0 && <p className="text-xs text-gray-600 mt-0.5">≈ ${plan.price} USD</p>}
              </div>
              <ul className="space-y-2 flex-1">
                {features.map(f => (
                  <li key={f} className="flex items-start gap-2 text-xs text-gray-400">
                    <Check size={12} className="text-green-400 mt-0.5 shrink-0" /> {f}
                  </li>
                ))}
              </ul>
              {!isCurrent && plan.id !== 'free' && (
                <button
                  onClick={() => upgrade(plan.id)}
                  disabled={paying === plan.id}
                  className="w-full flex items-center justify-center gap-2 bg-green-500 hover:bg-green-400 disabled:opacity-50 text-black font-semibold py-2 rounded-lg text-sm transition-colors"
                >
                  <Zap size={13} /> {paying === plan.id ? 'Redirecting…' : 'Upgrade'}
                </button>
              )}
            </div>
          );
        })}
      </div>

      <p className="text-xs text-gray-700 text-center">
        Payments processed securely by Paystack. Plans activate immediately after payment.
      </p>
    </div>
  );
}
