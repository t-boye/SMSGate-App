'use client';
import { useEffect, useState } from 'react';
import { getToken } from '@/lib/auth';
import { api } from '@/lib/api';
import { MessageSquare, RefreshCw } from 'lucide-react';

const STATE_COLORS: Record<string, string> = {
  Pending:   'bg-yellow-500/20 text-yellow-400',
  Processed: 'bg-blue-500/20 text-blue-400',
  Sent:      'bg-green-500/20 text-green-400',
  Delivered: 'bg-green-500/20 text-green-300',
  Failed:    'bg-red-500/20 text-red-400',
};

export default function MessagesPage() {
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const token = getToken()!;

  async function load() {
    setLoading(true);
    try { setMessages(await api.messages(token)); } catch { }
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Messages</h2>
          <p className="text-gray-400 text-sm mt-1">Recent SMS sent through your gateway</p>
        </div>
        <button onClick={load} className="flex items-center gap-2 text-sm text-gray-400 hover:text-white border border-gray-700 rounded-lg px-3 py-2">
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {loading ? (
        <p className="text-gray-500 animate-pulse">Loading…</p>
      ) : messages.length === 0 ? (
        <div className="text-center py-16 text-gray-500">
          <MessageSquare size={48} className="mx-auto mb-4 opacity-30" />
          <p>No messages yet. Send your first SMS via the API.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {messages.map((msg: any) => (
            <div
              key={msg.id}
              className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden"
            >
              <button
                onClick={() => setExpanded(e => e === msg.id ? null : msg.id)}
                className="w-full flex items-start justify-between gap-4 p-4 text-left hover:bg-gray-800/50"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{msg.message}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    To: {msg.phoneNumbers?.join(', ')} · {new Date(msg.createdAt).toLocaleString()}
                  </p>
                </div>
                <span className={`text-xs font-medium px-2 py-1 rounded-full flex-shrink-0 ${STATE_COLORS[msg.state] ?? 'bg-gray-700 text-gray-300'}`}>
                  {msg.state}
                </span>
              </button>

              {expanded === msg.id && (
                <div className="border-t border-gray-800 px-4 py-3 space-y-2">
                  <p className="text-xs text-gray-500">Message ID: <span className="text-gray-300 font-mono">{msg.id}</span></p>
                  {msg.recipients?.map((r: any, i: number) => (
                    <div key={i} className="flex items-center justify-between text-xs">
                      <span className="text-gray-400">{r.phoneNumber}</span>
                      <span className={`px-2 py-0.5 rounded-full ${STATE_COLORS[r.state] ?? 'bg-gray-700 text-gray-300'}`}>{r.state}</span>
                    </div>
                  ))}
                  {msg.isEncrypted && <p className="text-xs text-purple-400">🔒 Encrypted</p>}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
