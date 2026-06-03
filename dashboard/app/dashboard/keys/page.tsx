'use client';
import { useEffect, useState } from 'react';
import { getToken } from '@/lib/auth';
import { api } from '@/lib/api';
import { Key, Plus, Trash2, Copy, Check, Eye, EyeOff, X } from 'lucide-react';

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

export default function ApiKeysPage() {
  const [keys, setKeys]       = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName]       = useState('');
  const [saving, setSaving]   = useState(false);
  const [error, setError]     = useState('');
  const [copied, setCopied]   = useState<string | null>(null);
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
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  }

  function mask(key: string) {
    return key.slice(0, 10) + '•'.repeat(22);
  }

  return (
    <div className="max-w-3xl space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold text-white">API Keys</h1>
        <p className="text-sm text-gray-500 mt-0.5">Authenticate your apps to send SMS via the REST API</p>
      </div>

      {/* Create form */}
      <Card className="p-5">
        <h3 className="text-sm font-semibold text-white mb-3">Create new key</h3>
        {error && <p className="text-red-400 text-xs mb-3">{error}</p>}
        <form onSubmit={create} className="flex gap-2">
          <input
            required value={name} onChange={e => setName(e.target.value)}
            placeholder="Key name (e.g. production-app)"
            className="flex-1 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 border focus:outline-none focus:border-green-500/60 transition-colors"
            style={{ background: 'var(--bg-raised)', borderColor: 'var(--border-md)' }}
          />
          <button type="submit" disabled={saving}
            className="flex items-center gap-2 bg-green-500 hover:bg-green-400 disabled:opacity-50 text-black font-semibold px-4 py-2 rounded-lg text-sm transition-colors shrink-0">
            <Plus size={15} /> {saving ? 'Creating…' : 'Create'}
          </button>
        </form>
      </Card>

      {/* Usage hint */}
      <Card className="p-4">
        <p className="text-xs text-gray-500 mb-2 font-medium">Authentication header</p>
        <pre className="text-xs text-green-300 font-mono" style={{ background: 'var(--bg-raised)', borderRadius: 8, padding: '8px 12px' }}>
          {`Authorization: Bearer YOUR_API_KEY`}
        </pre>
      </Card>

      {/* List */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(2)].map((_, i) => (
            <Card key={i} className="p-5">
              <Skeleton className="h-4 w-32 mb-2" />
              <Skeleton className="h-3 w-24 mb-3" />
              <Skeleton className="h-7 w-64" />
            </Card>
          ))}
        </div>
      ) : keys.length === 0 ? (
        <Card className="py-16 flex flex-col items-center text-center">
          <Key size={40} className="text-gray-700 mb-3" />
          <p className="text-sm text-gray-500 mb-1">No API keys yet</p>
          <p className="text-xs text-gray-600">Create a key above to start sending SMS</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {keys.map((k: any) => (
            <Card key={k.key} className="p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white">{k.name}</p>
                  <p className="text-xs text-gray-600 mt-0.5">Created {new Date(k.createdAt).toLocaleDateString()}</p>
                  <div className="flex items-center gap-2 mt-2.5">
                    <code className="text-xs rounded-md px-2.5 py-1 text-green-300 font-mono" style={{ background: 'var(--bg-raised)' }}>
                      {revealed === k.key ? k.key : mask(k.key)}
                    </code>
                    <button onClick={() => setRevealed(r => r === k.key ? null : k.key)}
                      className="text-gray-600 hover:text-white transition-colors" title={revealed === k.key ? 'Hide' : 'Reveal'}>
                      {revealed === k.key ? <EyeOff size={13} /> : <Eye size={13} />}
                    </button>
                    <button onClick={() => copy(k.key)} className="text-gray-600 hover:text-white transition-colors" title="Copy">
                      {copied === k.key ? <Check size={13} className="text-green-400" /> : <Copy size={13} />}
                    </button>
                  </div>
                </div>
                <button onClick={() => remove(k.key)} className="text-gray-700 hover:text-red-400 transition-colors shrink-0">
                  <Trash2 size={16} />
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
