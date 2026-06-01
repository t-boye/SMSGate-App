'use client';
import { useEffect, useState } from 'react';
import { getToken } from '@/lib/auth';
import { api } from '@/lib/api';
import { Key, Plus, Trash2, Copy, Check, Eye, EyeOff } from 'lucide-react';

export default function ApiKeysPage() {
  const [keys, setKeys] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState<string | null>(null);
  const [revealed, setRevealed] = useState<string | null>(null);

  const token = getToken()!;

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    try { setKeys(await api.apiKeys(token)); } catch { }
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
    if (!confirm('Delete this API key? This cannot be undone.')) return;
    await api.deleteApiKey(token, key).catch(console.error);
    setKeys(k => k.filter(x => x.key !== key));
  }

  function copy(key: string) {
    navigator.clipboard.writeText(key);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  }

  function mask(key: string) {
    return key.slice(0, 8) + '••••••••••••••••••••••••';
  }

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h2 className="text-2xl font-bold">API Keys</h2>
        <p className="text-gray-400 text-sm mt-1">Use these keys to submit SMS jobs from your app</p>
      </div>

      <form onSubmit={create} className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
        <h3 className="font-semibold mb-4">Create New Key</h3>
        {error && <p className="text-red-400 text-sm mb-3">{error}</p>}
        <div className="flex gap-3">
          <input
            required value={name} onChange={e => setName(e.target.value)}
            placeholder="Key name (e.g. my-app)"
            className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-green-500"
          />
          <button type="submit" disabled={saving} className="bg-green-500 hover:bg-green-400 disabled:opacity-50 text-black font-semibold px-4 py-2 rounded-lg text-sm flex items-center gap-2">
            <Plus size={16} /> {saving ? 'Creating…' : 'Create'}
          </button>
        </div>
      </form>

      {loading ? (
        <p className="text-gray-500 animate-pulse">Loading…</p>
      ) : keys.length === 0 ? (
        <div className="text-center py-16 text-gray-500">
          <Key size={48} className="mx-auto mb-4 opacity-30" />
          <p>No API keys yet. Create one to start sending SMS.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {keys.map((k: any) => (
            <div key={k.key} className="bg-gray-900 border border-gray-800 rounded-2xl p-5 flex items-center justify-between gap-4">
              <div className="flex-1 min-w-0">
                <p className="font-medium">{k.name}</p>
                <p className="text-xs text-gray-500 mt-1">Created {new Date(k.createdAt).toLocaleDateString()}</p>
                <div className="flex items-center gap-2 mt-2">
                  <code className="text-xs bg-gray-800 rounded px-2 py-1 text-green-300 font-mono">
                    {revealed === k.key ? k.key : mask(k.key)}
                  </code>
                  <button onClick={() => setRevealed(r => r === k.key ? null : k.key)} className="text-gray-500 hover:text-white">
                    {revealed === k.key ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                  <button onClick={() => copy(k.key)} className="text-gray-500 hover:text-white">
                    {copied === k.key ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
                  </button>
                </div>
              </div>
              <button onClick={() => remove(k.key)} className="text-gray-600 hover:text-red-400 flex-shrink-0">
                <Trash2 size={18} />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
        <p className="text-sm font-medium mb-2">How to use</p>
        <pre className="text-xs text-green-300 bg-gray-800 rounded-lg p-4 overflow-x-auto">{`Authorization: Bearer YOUR_API_KEY`}</pre>
      </div>
    </div>
  );
}
