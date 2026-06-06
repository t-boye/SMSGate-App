'use client';
import { useEffect, useState } from 'react';
import { getToken } from '@/lib/auth';
import { api } from '@/lib/api';
import { Send, Smartphone, Loader2, Check, AlertCircle, Plus, X, Wifi, WifiOff } from 'lucide-react';

function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`skeleton ${className}`} />;
}

type SimInfo = { slotIndex: number; displayName: string; phoneNumber: string; subscriptionId: number };
type Device  = { id: string; name: string; isOnline: boolean; sims: SimInfo[]; lastSeenAt: string | null };
type Result  = { type: 'success' | 'error'; msg: string };

export default function SendPage() {
  const [devices, setDevices]     = useState<Device[]>([]);
  const [loading, setLoading]     = useState(true);
  const [deviceId, setDeviceId]   = useState('');
  const [simNumber, setSimNumber] = useState<number | null>(null);
  const [numbers, setNumbers]     = useState<string[]>(['']);
  const [message, setMessage]     = useState('');
  const [sending, setSending]     = useState(false);
  const [result, setResult]       = useState<Result | null>(null);
  const token = getToken()!;

  useEffect(() => {
    api.devices(token)
      .then((d: Device[]) => {
        setDevices(d);
        const first = d.find(x => x.isOnline) ?? d[0];
        if (first) {
          setDeviceId(first.id);
          if (first.sims?.length) setSimNumber(first.sims[0].slotIndex + 1);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const selectedDevice = devices.find(d => d.id === deviceId) ?? null;

  function selectDevice(id: string) {
    setDeviceId(id);
    setSimNumber(null);
    const d = devices.find(x => x.id === id);
    if (d?.sims?.length) setSimNumber(d.sims[0].slotIndex + 1);
  }

  const addNumber    = ()         => setNumbers(n => [...n, '']);
  const removeNumber = (i: number) => setNumbers(n => n.filter((_, idx) => idx !== i));
  const setNumber    = (i: number, v: string) => setNumbers(n => n.map((x, idx) => idx === i ? v : x));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const phones = numbers.map(n => n.trim()).filter(Boolean);
    if (!phones.length || !message.trim()) return;
    setSending(true); setResult(null);
    try {
      const res = await api.sendMessage(token, {
        message: message.trim(),
        phoneNumbers: phones,
        ...(deviceId   ? { deviceId }   : {}),
        ...(simNumber != null ? { simNumber } : {}),
      });
      setResult({ type: 'success', msg: `Queued — ID: ${res.id}` });
      setMessage(''); setNumbers(['']);
    } catch (err: any) {
      setResult({ type: 'error', msg: err.message ?? 'Send failed' });
    }
    setSending(false);
  }

  const charCount  = message.length;
  const smsCount   = Math.ceil(charCount / 160) || 1;
  const validPhones = numbers.filter(n => n.trim()).length;
  const totalSMS   = smsCount * (validPhones || 1);

  return (
    <div className="max-w-2xl space-y-5">
      <div>
        <h1 className="text-xl font-bold text-white">Send SMS</h1>
        <p className="text-sm text-gray-500 mt-0.5">Send a message directly through your gateway</p>
      </div>

      {loading ? (
        <div className="rounded-2xl border p-5 space-y-4" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
          <Skeleton className="h-4 w-32" />
          {[...Array(2)].map((_, i) => <Skeleton key={i} className="h-14 rounded-xl" />)}
        </div>
      ) : devices.length === 0 ? (
        <div className="rounded-2xl border py-16 flex flex-col items-center text-center" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
          <div className="w-14 h-14 rounded-2xl bg-gray-800/60 flex items-center justify-center mb-4">
            <Smartphone size={24} className="text-gray-600" />
          </div>
          <p className="text-sm font-medium text-gray-400 mb-1">No devices available</p>
          <p className="text-xs text-gray-600">Add an Android phone first to send SMS</p>
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-4">

          {/* Device selector */}
          <div className="rounded-2xl border p-5" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Device</p>
            <div className="space-y-2">
              {devices.map(d => (
                <button key={d.id} type="button" onClick={() => selectDevice(d.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border text-left transition-all ${
                    deviceId === d.id ? 'border-green-500/40 bg-green-500/5' : 'hover:bg-white/[0.02]'
                  }`}
                  style={{ borderColor: deviceId === d.id ? undefined : 'var(--border)' }}
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${d.isOnline ? 'bg-green-500/10' : 'bg-gray-800/60'}`}>
                    {d.isOnline ? <Wifi size={14} className="text-green-400" /> : <WifiOff size={14} className="text-gray-600" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white">{d.name}</p>
                    <p className="text-xs text-gray-600">
                      {d.isOnline ? 'Online' : d.lastSeenAt ? `Last seen ${new Date(d.lastSeenAt).toLocaleString()}` : 'Never connected'}
                    </p>
                  </div>
                  {deviceId === d.id && <Check size={14} className="text-green-400 shrink-0" />}
                </button>
              ))}
            </div>
          </div>

          {/* SIM selector */}
          {selectedDevice && selectedDevice.sims.length > 0 && (
            <div className="rounded-2xl border p-5" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">SIM Card</p>
              <div className="flex flex-wrap gap-2">
                {selectedDevice.sims.map(sim => (
                  <button key={sim.slotIndex} type="button" onClick={() => setSimNumber(sim.slotIndex + 1)}
                    className={`flex-1 min-w-[130px] px-4 py-3 rounded-xl border text-left transition-all ${
                      simNumber === sim.slotIndex + 1 ? 'border-green-500/40 bg-green-500/5' : 'hover:bg-white/[0.02]'
                    }`}
                    style={{ borderColor: simNumber === sim.slotIndex + 1 ? undefined : 'var(--border)' }}
                  >
                    <p className="text-sm font-semibold text-white">{sim.displayName}</p>
                    {sim.phoneNumber && <p className="text-xs text-gray-500 mt-0.5">{sim.phoneNumber}</p>}
                    <p className="text-[10px] text-gray-600 mt-0.5">SIM {sim.slotIndex + 1}</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Recipients */}
          <div className="rounded-2xl border p-5" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Recipients</p>
              <button type="button" onClick={addNumber}
                className="text-xs text-green-400 hover:text-green-300 transition-colors flex items-center gap-1">
                <Plus size={11} /> Add number
              </button>
            </div>
            <div className="space-y-2">
              {numbers.map((n, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input
                    type="tel" required value={n} onChange={e => setNumber(i, e.target.value)}
                    placeholder="+233244000000"
                    className="input-field flex-1"
                  />
                  {numbers.length > 1 && (
                    <button type="button" onClick={() => removeNumber(i)} className="text-gray-600 hover:text-red-400 transition-colors p-1">
                      <X size={14} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Message */}
          <div className="rounded-2xl border p-5" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Message</p>
              <span className={`text-xs ${charCount > 160 ? 'text-yellow-400' : 'text-gray-600'}`}>
                {charCount}/160 · {smsCount} SMS × {validPhones || 1} = <strong>{totalSMS}</strong> total
              </span>
            </div>
            <textarea
              required value={message} onChange={e => setMessage(e.target.value)} rows={4}
              placeholder="Type your message here…"
              className="input-field resize-none"
            />
          </div>

          {/* Result */}
          {result && (
            <div className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm border ${
              result.type === 'success'
                ? 'text-green-400'
                : 'text-red-400'
            }`} style={{
              background: result.type === 'success' ? 'rgba(34,197,94,0.08)' : 'rgba(239,68,68,0.08)',
              borderColor: result.type === 'success' ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)',
            }}>
              {result.type === 'success' ? <Check size={14} /> : <AlertCircle size={14} />}
              {result.msg}
            </div>
          )}

          <button
            type="submit"
            disabled={sending || !message.trim() || !numbers.some(n => n.trim())}
            className="btn-primary w-full py-3 text-sm"
          >
            {sending
              ? <><Loader2 size={15} className="animate-spin" /> Sending…</>
              : <><Send size={14} /> Send to {validPhones || 1} recipient{(validPhones || 1) !== 1 ? 's' : ''}</>
            }
          </button>
        </form>
      )}
    </div>
  );
}
