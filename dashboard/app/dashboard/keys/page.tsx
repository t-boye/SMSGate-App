'use client';
import { useEffect, useState } from 'react';
import { getToken } from '@/lib/auth';
import { api } from '@/lib/api';
import { Key, Plus, Trash2, Copy, Check, Eye, EyeOff } from 'lucide-react';

function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`skeleton ${className}`} />;
}

export default function ApiKeysPage() {
  const [keys, setKeys]         = useState<any[]>([]);
  const [loading, setLoading]   = useState(true);
  const [name, setName]         = useState('');
  const [saving, setSaving]     = useState(false);
  const [error, setError]       = useState('');
  const [copied, setCopied]     = useState<string | null>(null);
  const [revealed, setRevealed] = useState<string | null>(null);

  const token = getToken()!;

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    try { setKeys(await api.apiKeys(token)); } catch {}
    setLoading(false);
  }

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setError(''); setSaving(true);
    try {
      const k = await api.createApiKey(token, name);
      setKeys(prev => [k, ...prev]);
      setName('');
    } catch (err: any) { setError(err.message); }
    setSaving(false);
  }

  async function remove(key: string) {
    if (!confirm('Delete this API key? Apps using it will stop working immediately.')) return;
    await api.deleteApiKey(token, key).catch(console.error);
    setKeys(k => k.filter(x => x.key !== key));
  }

  function copy(key: string) {
    navigator.clipboard.writeText(key);
    setCopied(key); setTimeout(() => setCopied(null), 2000);
  }

  function mask(key: string) { return key.slice(0, 10) + '•'.repeat(20); }

  return (
    <div className="max-w-3xl space-y-5">
      <div>
        <h1 className="text-xl font-bold text-white">API Keys</h1>
        <p className="text-sm text-gray-500 mt-0.5">Authenticate your apps to send SMS via the REST API</p>
      </div>

      {/* Create form */}
      <div className="rounded-2xl border p-5" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
        <h3 className="text-sm font-semibold text-white mb-3">Create new key</h3>
        {error && <p className="text-red-400 text-xs mb-3">{error}</p>}
        <form onSubmit={create} className="flex gap-2">
          <input
            required value={name} onChange={e => setName(e.target.value)}
            placeholder="Key name — e.g. production-app"
            className="input-field flex-1"
          />
          <button type="submit" disabled={saving} className="btn-primary text-xs px-4 shrink-0">
            <Plus size={13} /> {saving ? 'Creating…' : 'Create'}
          </button>
        </form>
      </div>

      {/* Auth hint */}
      <div className="rounded-xl border px-4 py-3 flex items-start gap-3" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
        <div className="w-7 h-7 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center shrink-0 mt-0.5">
          <Key size={13} className="text-purple-400" />
        </div>
        <div>
          <p className="text-xs font-medium text-gray-400 mb-1.5">Use in your requests</p>
          <code className="text-xs text-green-300 font-mono">Authorization: Bearer YOUR_API_KEY</code>
        </div>
      </div>

      {/* List */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="rounded-2xl border p-5" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
              <Skeleton className="h-4 w-32 mb-2" />
              <Skeleton className="h-3 w-24 mb-3" />
              <Skeleton className="h-8 w-56" />
            </div>
          ))}
        </div>
      ) : keys.length === 0 ? (
        <div className="rounded-2xl border py-16 flex flex-col items-center text-center" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
          <div className="w-14 h-14 rounded-2xl bg-gray-800/60 flex items-center justify-center mb-4">
            <Key size={24} className="text-gray-600" />
          </div>
          <p className="text-sm font-medium text-gray-400 mb-1">No API keys yet</p>
          <p className="text-xs text-gray-600">Create a key above to start sending SMS</p>
        </div>
      ) : (
        <div className="space-y-3">
          {keys.map((k: any) => (
            <div key={k.key} className="rounded-2xl border p-5 card-hover" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-semibold text-white">{k.name}</p>
                    <span className="text-[10px] text-gray-600">
                      Created {new Date(k.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-2.5">
                    <code className="text-[10px] rounded-lg px-2.5 py-1.5 text-green-300 font-mono" style={{ background: 'var(--bg-raised)' }}>
                      {revealed === k.key ? k.key : mask(k.key)}
                    </code>
                    <button onClick={() => setRevealed(r => r === k.key ? null : k.key)}
                      className="text-gray-600 hover:text-white transition-colors" title={revealed === k.key ? 'Hide' : 'Reveal'}>
                      {revealed === k.key ? <EyeOff size={12} /> : <Eye size={12} />}
                    </button>
                    <button onClick={() => copy(k.key)} className="text-gray-600 hover:text-white transition-colors" title="Copy">
                      {copied === k.key ? <Check size={12} className="text-green-400" /> : <Copy size={12} />}
                    </button>
                  </div>
                </div>
                <button onClick={() => remove(k.key)} className="text-gray-700 hover:text-red-400 transition-colors shrink-0 p-1" title="Delete key">
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
