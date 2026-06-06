'use client';
import { useEffect, useState } from 'react';
import { getToken } from '@/lib/auth';
import { api } from '@/lib/api';
import { Smartphone, Plus, Trash2, Copy, Check, X, ArrowRight, Wifi, WifiOff, Signal } from 'lucide-react';
import Link from 'next/link';

function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`skeleton ${className}`} />;
}

export default function DevicesPage() {
  const [devices, setDevices]   = useState<any[]>([]);
  const [me, setMe]             = useState<any>(null);
  const [loading, setLoading]   = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm]         = useState({ name: '', login: '', password: '' });
  const [saving, setSaving]     = useState(false);
  const [error, setError]       = useState('');
  const [copied, setCopied]     = useState<string | null>(null);

  const token = getToken()!;

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    try {
      const [d, m] = await Promise.all([api.devices(token), api.me(token)]);
      setDevices(d); setMe(m);
    } catch {}
    setLoading(false);
  }

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setError(''); setSaving(true);
    try {
      await api.createDevice(token, form);
      setForm({ name: '', login: '', password: '' });
      setShowForm(false);
      await load();
    } catch (err: any) { setError(err.message); }
    setSaving(false);
  }

  async function remove(id: string) {
    if (!confirm('Delete this device? This cannot be undone.')) return;
    await api.deleteDevice(token, id).catch(console.error);
    setDevices(d => d.filter(x => x.id !== id));
  }

  function copy(text: string, id: string) {
    navigator.clipboard.writeText(text);
    setCopied(id); setTimeout(() => setCopied(null), 2000);
  }

  const deviceLimit = me?.plan?.deviceLimit ?? null;
  const atLimit     = deviceLimit !== null && devices.length >= deviceLimit;
  const onlineCount = devices.filter(d => d.isOnline).length;

  return (
    <div className="max-w-3xl space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-bold text-white">Devices</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {loading ? 'Loading…' : `${devices.length} device${devices.length !== 1 ? 's' : ''} · ${onlineCount} online`}
            {deviceLimit !== null && (
              <span className={`ml-2 ${atLimit ? 'text-red-400' : 'text-gray-600'}`}>
                ({devices.length}/{deviceLimit} limit)
              </span>
            )}
          </p>
        </div>
        <button
          onClick={() => setShowForm(s => !s)}
          disabled={atLimit}
          title={atLimit ? `Upgrade to add more (limit: ${deviceLimit})` : undefined}
          className="btn-primary text-xs px-3.5 py-2"
        >
          <Plus size={14} /> Add Device
        </button>
      </div>

      {/* Limit banner */}
      {atLimit && (
        <div className="flex items-center justify-between gap-4 rounded-xl px-4 py-3 border" style={{ background: 'rgba(234,179,8,0.06)', borderColor: 'rgba(234,179,8,0.2)' }}>
          <p className="text-sm text-yellow-300/80">
            Device limit reached on the <span className="font-semibold capitalize">{me?.user?.plan}</span> plan.
          </p>
          <Link href="/dashboard/billing" className="text-xs text-green-400 hover:text-green-300 flex items-center gap-1 shrink-0 transition-colors">
            Upgrade <ArrowRight size={10} />
          </Link>
        </div>
      )}

      {/* Add form */}
      {showForm && (
        <div className="rounded-2xl border p-5" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-white">New Device</h3>
            <button onClick={() => setShowForm(false)} className="text-gray-600 hover:text-white transition-colors">
              <X size={15} />
            </button>
          </div>
          {error && <p className="text-red-400 text-xs mb-3">{error}</p>}
          <form onSubmit={create} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                ['name',     'Device name',  'My Phone',    'text'],
                ['login',    'Username',     'myphone',     'text'],
                ['password', 'Password',     'Min 6 chars', 'password'],
              ].map(([k, label, ph, type]) => (
                <div key={k}>
                  <label className="block text-xs text-gray-500 mb-1.5 font-medium">{label}</label>
                  <input
                    required type={type}
                    value={(form as any)[k]}
                    onChange={e => setForm(f => ({ ...f, [k]: e.target.value }))}
                    placeholder={ph}
                    className="input-field"
                  />
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-600">After creating: open SMSGate app → Settings → Cloud Server → enter these credentials.</p>
            <div className="flex items-center gap-3 pt-1">
              <button type="submit" disabled={saving} className="btn-primary text-xs px-4 py-2">
                {saving ? 'Creating…' : 'Create device'}
              </button>
              <button type="button" onClick={() => setShowForm(false)} className="text-sm text-gray-600 hover:text-white transition-colors">Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* List */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="rounded-2xl border p-5" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
              <div className="flex items-start gap-4">
                <Skeleton className="w-9 h-9 rounded-xl" />
                <div className="flex-1">
                  <Skeleton className="h-4 w-32 mb-2" />
                  <Skeleton className="h-3 w-24 mb-3" />
                  <Skeleton className="h-7 w-48" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : devices.length === 0 ? (
        <div className="rounded-2xl border py-16 flex flex-col items-center text-center" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
          <div className="w-14 h-14 rounded-2xl bg-gray-800/60 flex items-center justify-center mb-4">
            <Smartphone size={24} className="text-gray-600" />
          </div>
          <p className="text-sm font-medium text-gray-400 mb-1">No devices yet</p>
          <p className="text-xs text-gray-600 mb-4">Add your Android phone to start sending SMS</p>
          <button onClick={() => setShowForm(true)} className="btn-primary text-xs px-4 py-2">
            <Plus size={13} /> Add first device
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {devices.map((d: any) => (
            <div key={d.id} className="rounded-2xl border p-5 card-hover" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  {/* Status icon */}
                  <div className={`mt-0.5 w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${d.isOnline ? 'bg-green-500/10' : 'bg-gray-800/60'}`}>
                    {d.isOnline
                      ? <Wifi size={16} className="text-green-400" />
                      : <WifiOff size={16} className="text-gray-600" />
                    }
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-semibold text-white">{d.name}</p>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${d.isOnline ? 'bg-green-500/10 text-green-400' : 'bg-gray-800 text-gray-600'}`}>
                        {d.isOnline ? 'Online' : d.lastSeenAt ? `Last seen ${new Date(d.lastSeenAt).toLocaleDateString()}` : 'Never connected'}
                      </span>
                    </div>
                    <p className="text-xs text-gray-600 mt-0.5">@{d.login}</p>

                    {/* SIM cards */}
                    {d.sims?.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {d.sims.map((sim: any) => (
                          <span key={sim.slotIndex} className="flex items-center gap-1 text-[10px] text-gray-500 bg-gray-800/60 rounded-md px-2 py-0.5">
                            <Signal size={9} /> SIM {sim.slotIndex + 1}: {sim.displayName}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Token */}
                    <div className="flex items-center gap-2 mt-2.5">
                      <code className="text-[10px] rounded-lg px-2.5 py-1.5 text-green-300 font-mono max-w-[240px] truncate" style={{ background: 'var(--bg-raised)' }}>
                        {d.token}
                      </code>
                      <button onClick={() => copy(d.token, d.id)} className="text-gray-600 hover:text-white transition-colors" title="Copy token">
                        {copied === d.id ? <Check size={12} className="text-green-400" /> : <Copy size={12} />}
                      </button>
                    </div>
                  </div>
                </div>
                <button onClick={() => remove(d.id)} className="text-gray-700 hover:text-red-400 transition-colors shrink-0 p-1" title="Delete device">
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
