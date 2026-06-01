'use client';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { getToken } from '@/lib/auth';
import { api } from '@/lib/api';
import { Check, Zap } from 'lucide-react';

const FEATURES: Record<string, string[]> = {
  free:     ['100 SMS / month', '1 device', 'Community support'],
  basic:    ['5,000 SMS / month', 'Up to 3 devices', 'Email support'],
  pro:      ['30,000 SMS / month', 'Up to 10 devices', 'Priority support'],
  business: ['Unlimited SMS', 'Unlimited devices', 'Dedicated support'],
};

export default function BillingPage() {
  const [plans, setPlans] = useState<any[]>([]);
  const [usage, setUsage] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState<string | null>(null);
  const searchParams = useSearchParams();
  const status = searchParams.get('status');
  const token = getToken()!;

  useEffect(() => {
    Promise.all([api.plans(), api.usage(token)])
      .then(([p, u]) => { setPlans(p); setUsage(u); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  async function upgrade(planId: string) {
    setPaying(planId);
    try {
      const { authorizationUrl } = await api.initializePayment(token, planId);
      window.location.href = authorizationUrl;
    } catch (err: any) {
      alert(err.message ?? 'Payment initialization failed');
      setPaying(null);
    }
  }

  if (loading) return <p className="text-gray-500 animate-pulse">Loading…</p>;

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Billing & Plans</h2>
        <p className="text-gray-400 text-sm mt-1">
          Current plan: <span className="text-green-400 font-medium capitalize">{usage?.plan}</span>
          {usage?.smsLimit > 0 && ` · ${usage.smsUsed} / ${usage.smsLimit.toLocaleString()} SMS used this month`}
        </p>
      </div>

      {status === 'success' && (
        <div className="bg-green-900/30 border border-green-700 rounded-xl p-4 text-green-400 text-sm">
          Payment successful! Your plan has been upgraded.
        </div>
      )}
      {status === 'failed' && (
        <div className="bg-red-900/30 border border-red-700 rounded-xl p-4 text-red-400 text-sm">
          Payment was not completed. Please try again.
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {plans.map((plan: any) => {
          const isCurrent = usage?.plan === plan.id;
          const features = FEATURES[plan.id] ?? [];
          return (
            <div
              key={plan.id}
              className={`bg-gray-900 border rounded-2xl p-6 flex flex-col gap-4 ${
                isCurrent ? 'border-green-500' : 'border-gray-800'
              }`}
            >
              {isCurrent && (
                <span className="text-xs bg-green-500/20 text-green-400 border border-green-700 rounded-full px-2 py-0.5 self-start">Current</span>
              )}
              <div>
                <h3 className="font-bold text-lg">{plan.name}</h3>
                <p className="text-2xl font-bold mt-1">
                  {plan.price === 0 ? 'Free' : `GHS ${plan.priceGhs}`}
                  {plan.price > 0 && <span className="text-sm text-gray-400 font-normal"> /mo</span>}
                </p>
                {plan.price > 0 && <p className="text-xs text-gray-500">≈ ${plan.price} USD</p>}
              </div>
              <ul className="space-y-2 flex-1">
                {features.map(f => (
                  <li key={f} className="flex items-start gap-2 text-sm text-gray-300">
                    <Check size={14} className="text-green-400 mt-0.5 flex-shrink-0" /> {f}
                  </li>
                ))}
              </ul>
              {!isCurrent && plan.id !== 'free' && (
                <button
                  onClick={() => upgrade(plan.id)}
                  disabled={paying === plan.id}
                  className="w-full bg-green-500 hover:bg-green-400 disabled:opacity-50 text-black font-semibold py-2 rounded-lg text-sm flex items-center justify-center gap-2"
                >
                  <Zap size={14} /> {paying === plan.id ? 'Redirecting…' : 'Upgrade'}
                </button>
              )}
            </div>
          );
        })}
      </div>

      <p className="text-xs text-gray-600 text-center">
        Payments processed securely by Paystack. Plans activate immediately after payment.
      </p>
    </div>
  );
}
