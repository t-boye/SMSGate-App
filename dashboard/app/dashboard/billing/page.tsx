'use client';
import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { getToken } from '@/lib/auth';
import { api } from '@/lib/api';
import { Check, Zap, AlertCircle, TrendingUp, Star } from 'lucide-react';

function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`skeleton ${className}`} />;
}

const FEATURES: Record<string, string[]> = {
  free:     ['100 SMS / month', '1 device', '1 API key', 'REST API access'],
  basic:    ['5,000 SMS / month', 'Up to 3 devices', '5 API keys', 'Email support'],
  pro:      ['30,000 SMS / month', 'Up to 10 devices', 'Unlimited API keys', 'Priority support'],
  business: ['Unlimited SMS', 'Unlimited devices', 'Unlimited API keys', 'Dedicated support'],
};

const POPULAR = 'pro';

export default function BillingPage() {
  return (
    <Suspense fallback={<BillingSkeleton />}>
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

  if (loading) return <BillingSkeleton />;

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h1 className="text-xl font-bold text-white">Billing &amp; Plans</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Current plan: <span className="text-green-400 font-semibold capitalize">{usage?.plan ?? '—'}</span>
          {usage?.smsLimit > 0 && ` · ${usage.smsUsed.toLocaleString()} / ${usage.smsLimit.toLocaleString()} SMS used`}
        </p>
      </div>

      {/* Status banners */}
      {status === 'success' && (
        <div className="flex items-center gap-3 rounded-xl px-4 py-3 border text-sm" style={{ background: 'rgba(34,197,94,0.08)', borderColor: 'rgba(34,197,94,0.2)' }}>
          <Check size={15} className="text-green-400" /> <span className="text-green-400">Payment successful — your plan has been upgraded.</span>
        </div>
      )}
      {status === 'failed' && (
        <div className="flex items-center gap-3 rounded-xl px-4 py-3 border text-sm" style={{ background: 'rgba(239,68,68,0.08)', borderColor: 'rgba(239,68,68,0.2)' }}>
          <AlertCircle size={15} className="text-red-400" /> <span className="text-red-400">Payment was not completed. Please try again.</span>
        </div>
      )}
      {error && (
        <div className="flex items-center gap-3 rounded-xl px-4 py-3 border text-sm" style={{ background: 'rgba(239,68,68,0.08)', borderColor: 'rgba(239,68,68,0.2)' }}>
          <AlertCircle size={15} className="text-red-400" /> <span className="text-red-400">{error}</span>
        </div>
      )}

      {/* Usage bar */}
      {usage?.smsLimit > 0 && (
        <div className="rounded-2xl border p-5" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <TrendingUp size={14} className={pct >= 80 ? 'text-red-400' : 'text-green-400'} />
              <span className="text-sm font-medium text-white">Monthly SMS usage</span>
            </div>
            <span className={`text-sm font-bold ${pct >= 80 ? 'text-red-400' : 'text-white'}`}>
              {usage.smsUsed.toLocaleString()} <span className="text-gray-600 font-normal">/ {usage.smsLimit.toLocaleString()}</span>
            </span>
          </div>
          <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--bg-raised)' }}>
            <div className="h-full rounded-full transition-all duration-500" style={{
              width: `${pct}%`,
              background: pct >= 80 ? '#ef4444' : 'linear-gradient(90deg, #22c55e, #4ade80)',
            }} />
          </div>
          <p className="text-xs text-gray-600 mt-2">Resets {new Date(usage.resetsAt).toLocaleDateString()}</p>
        </div>
      )}

      {/* Plans grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {plans.map((plan: any) => {
          const isCurrent = usage?.plan === plan.id;
          const isPopular = plan.id === POPULAR;
          const features  = FEATURES[plan.id] ?? [];
          return (
            <div key={plan.id} className={`relative rounded-2xl border p-5 flex flex-col transition-all ${
              isCurrent ? 'border-green-500/40' : isPopular ? 'border-purple-500/30' : 'card-hover'
            }`} style={{
              background: isCurrent
                ? 'linear-gradient(135deg, rgba(34,197,94,0.06), rgba(34,197,94,0.02))'
                : isPopular
                  ? 'linear-gradient(135deg, rgba(168,85,247,0.06), rgba(168,85,247,0.02))'
                  : 'var(--bg-surface)',
              borderColor: isCurrent ? undefined : isPopular ? undefined : 'var(--border)',
            }}>
              {isPopular && !isCurrent && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 flex items-center gap-1 text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-purple-500 text-white">
                  <Star size={8} /> Popular
                </div>
              )}
              {isCurrent && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-green-500 text-black">
                  Current
                </div>
              )}

              <div className="mb-4">
                <h3 className="font-bold text-white text-sm">{plan.name}</h3>
                <p className="text-2xl font-black text-white mt-2">
                  {plan.price === 0 ? 'Free' : `GHS ${plan.priceGhs}`}
                  {plan.price > 0 && <span className="text-xs text-gray-600 font-normal ml-1">/mo</span>}
                </p>
                {plan.price > 0 && <p className="text-[10px] text-gray-600 mt-0.5">≈ ${plan.price} USD</p>}
              </div>

              <ul className="space-y-2 flex-1 mb-5">
                {features.map(f => (
                  <li key={f} className="flex items-start gap-2 text-xs text-gray-400">
                    <Check size={11} className="text-green-400 mt-0.5 shrink-0" /> {f}
                  </li>
                ))}
              </ul>

              {isCurrent ? (
                <div className="text-center text-xs text-green-400 font-semibold py-2 rounded-lg border" style={{ borderColor: 'rgba(34,197,94,0.2)', background: 'var(--green-subtle)' }}>
                  Active plan
                </div>
              ) : plan.id === 'free' ? (
                <div className="text-center text-xs text-gray-600 py-2">Always free</div>
              ) : (
                <button
                  onClick={() => upgrade(plan.id)}
                  disabled={paying === plan.id}
                  className={`btn-primary w-full text-xs py-2 ${isPopular ? '' : 'opacity-80 hover:opacity-100'}`}
                >
                  <Zap size={12} /> {paying === plan.id ? 'Redirecting…' : 'Upgrade'}
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

function BillingSkeleton() {
  return (
    <div className="max-w-4xl space-y-5">
      <div><Skeleton className="h-6 w-40 mb-2" /><Skeleton className="h-4 w-64" /></div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-60 rounded-2xl" />)}
      </div>
    </div>
  );
}
