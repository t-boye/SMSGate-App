'use client';
import { useEffect, useState } from 'react';
import { getToken } from '@/lib/auth';
import { api } from '@/lib/api';
import { Smartphone, Plus, Trash2, Wifi, WifiOff, Copy, Check } from 'lucide-react';

export default function DevicesPage() {
  const [devices, setDevices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', login: '', password: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState<string | null>(null);

  const token = getToken()!;

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    try { setDevices(await api.devices(token)); } catch { }
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
    if (!confirm('Delete this device?')) return;
    await api.deleteDevice(token, id).catch(console.error);
    setDevices(d => d.filter(x => x.id !== id));
  }

  function copy(text: string, id: string) {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  }

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Devices</h2>
          <p className="text-gray-400 text-sm mt-1">Your Android phones acting as SMS gateways</p>
        </div>
        <button
          onClick={() => setShowForm(s => !s)}
          className="flex items-center gap-2 bg-green-500 hover:bg-green-400 text-black font-semibold px-4 py-2 rounded-lg text-sm"
        >
          <Plus size={16} /> Add Device
        </button>
      </div>

      {showForm && (
        <form onSubmit={create} className="bg-gray-900 border border-gray-800 rounded-2xl p-6 space-y-4">
          <h3 className="font-semibold">New Device</h3>
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[['name', 'Device name', 'My Phone'], ['login', 'Username', 'myphone'], ['password', 'Password', 'Min 6 chars']].map(([k, label, ph]) => (
              <div key={k}>
                <label className="text-xs text-gray-400 mb-1 block">{label}</label>
                <input
                  required type={k === 'password' ? 'password' : 'text'}
                  value={(form as any)[k]} onChange={e => setForm(f => ({ ...f, [k]: e.target.value }))}
                  placeholder={ph}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-green-500"
                />
              </div>
            ))}
          </div>
          <div className="flex gap-3">
            <button type="submit" disabled={saving} className="bg-green-500 hover:bg-green-400 disabled:opacity-50 text-black font-semibold px-4 py-2 rounded-lg text-sm">
              {saving ? 'Creating…' : 'Create'}
            </button>
            <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 rounded-lg text-sm text-gray-400 hover:text-white">Cancel</button>
          </div>
          <p className="text-xs text-gray-500">After creating, open the SMSGate Android app → Settings → Cloud Server → enter these credentials.</p>
        </form>
      )}

      {loading ? (
        <p className="text-gray-500 animate-pulse">Loading…</p>
      ) : devices.length === 0 ? (
        <div className="text-center py-16 text-gray-500">
          <Smartphone size={48} className="mx-auto mb-4 opacity-30" />
          <p>No devices yet. Add your Android phone to get started.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {devices.map((d: any) => (
            <div key={d.id} className="bg-gray-900 border border-gray-800 rounded-2xl p-5 flex items-start justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className={`mt-1 w-2 h-2 rounded-full ${d.isOnline ? 'bg-green-400' : 'bg-gray-600'}`} />
                <div>
                  <p className="font-medium">{d.name}</p>
                  <p className="text-xs text-gray-500 mt-1">Login: {d.login}</p>
                  <p className="text-xs text-gray-500">
                    {d.isOnline ? '🟢 Online' : d.lastSeenAt ? `Last seen ${new Date(d.lastSeenAt).toLocaleString()}` : 'Never connected'}
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <code className="text-xs bg-gray-800 rounded px-2 py-1 text-green-300 max-w-xs truncate">{d.token}</code>
                    <button onClick={() => copy(d.token, d.id)} className="text-gray-500 hover:text-white">
                      {copied === d.id ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
                    </button>
                  </div>
                </div>
              </div>
              <button onClick={() => remove(d.id)} className="text-gray-600 hover:text-red-400 flex-shrink-0">
                <Trash2 size={18} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
