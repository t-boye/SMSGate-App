'use client';
import { useEffect, useState } from 'react';
import { getToken } from '@/lib/auth';
import { api } from '@/lib/api';
import { MessageSquare, Smartphone, Key, Zap } from 'lucide-react';

export default function OverviewPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = getToken();
    if (!token) return;
    api.me(token).then(setData).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-gray-500 animate-pulse">Loading…</div>;
  if (!data) return null;

  const { user, plan, deviceCount, apiKeyCount } = data;
  const pct = plan.smsLimit > 0 ? Math.min(100, (plan.smsUsed / plan.smsLimit) * 100) : 0;

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h2 className="text-2xl font-bold">Welcome, {user.name} 👋</h2>
        <p className="text-gray-400 mt-1">
          Plan: <span className="text-green-400 font-medium capitalize">{user.plan}</span>
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={<MessageSquare size={20} className="text-green-400" />} label="SMS Used" value={plan.smsUsed.toLocaleString()} />
        <StatCard icon={<Zap size={20} className="text-yellow-400" />} label="SMS Remaining" value={plan.smsRemaining === null ? '∞' : plan.smsRemaining.toLocaleString()} />
        <StatCard icon={<Smartphone size={20} className="text-blue-400" />} label="Devices" value={deviceCount} />
        <StatCard icon={<Key size={20} className="text-purple-400" />} label="API Keys" value={apiKeyCount} />
      </div>

      {/* Usage bar */}
      {plan.smsLimit > 0 && (
        <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
          <div className="flex justify-between text-sm mb-3">
            <span className="text-gray-400">Monthly SMS Usage</span>
            <span className="text-white font-medium">{plan.smsUsed} / {plan.smsLimit.toLocaleString()}</span>
          </div>
          <div className="h-3 bg-gray-800 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${pct > 80 ? 'bg-red-500' : 'bg-green-500'}`}
              style={{ width: `${pct}%` }}
            />
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Resets {new Date(plan.resetsAt).toLocaleDateString()}
          </p>
        </div>
      )}

      {/* Quick start */}
      <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
        <h3 className="font-semibold mb-4">Quick Start</h3>
        <ol className="space-y-3 text-sm text-gray-400">
          <li className="flex gap-3"><span className="text-green-400 font-bold">1.</span> Go to <strong className="text-white">Devices</strong> → add your Android phone</li>
          <li className="flex gap-3"><span className="text-green-400 font-bold">2.</span> Go to <strong className="text-white">API Keys</strong> → create a key for your app</li>
          <li className="flex gap-3"><span className="text-green-400 font-bold">3.</span> Call the API to send SMS:</li>
        </ol>
        <pre className="mt-4 bg-gray-800 rounded-lg p-4 text-xs text-green-300 overflow-x-auto">{`curl -X POST https://sms-gate-app.vercel.app/api/v1/messages \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"message":"Hello!","phoneNumbers":["+233244000000"]}'`}</pre>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: any }) {
  return (
    <div className="bg-gray-900 rounded-2xl p-5 border border-gray-800">
      <div className="flex items-center gap-2 mb-2">{icon}<span className="text-xs text-gray-400">{label}</span></div>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  );
}
