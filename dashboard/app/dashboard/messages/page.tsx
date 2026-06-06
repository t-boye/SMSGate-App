'use client';
import { useEffect, useState } from 'react';
import { getToken } from '@/lib/auth';
import { api } from '@/lib/api';
import { MessageSquare, RefreshCw, ChevronDown, ChevronUp, Lock, Clock } from 'lucide-react';

function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`skeleton ${className}`} />;
}

const STATE_STYLE: Record<string, { bg: string; text: string; dot: string }> = {
  Pending:   { bg: 'bg-yellow-500/10', text: 'text-yellow-400',  dot: 'bg-yellow-400' },
  Processed: { bg: 'bg-blue-500/10',   text: 'text-blue-400',    dot: 'bg-blue-400' },
  Sent:      { bg: 'bg-green-500/10',  text: 'text-green-400',   dot: 'bg-green-400' },
  Delivered: { bg: 'bg-green-500/10',  text: 'text-green-300',   dot: 'bg-green-300' },
  Failed:    { bg: 'bg-red-500/10',    text: 'text-red-400',     dot: 'bg-red-400' },
};

export default function MessagesPage() {
  const [messages, setMessages]   = useState<any[]>([]);
  const [loading, setLoading]     = useState(true);
  const [expanded, setExpanded]   = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const token = getToken()!;

  async function load(quiet = false) {
    if (!quiet) setLoading(true); else setRefreshing(true);
    try { setMessages(await api.messages(token)); } catch {}
    setLoading(false); setRefreshing(false);
  }

  useEffect(() => { load(); }, []);

  return (
    <div className="max-w-4xl space-y-5">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-bold text-white">Messages</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {loading ? 'Loading…' : `${messages.length} message${messages.length !== 1 ? 's' : ''} — last 50 shown`}
          </p>
        </div>
        <button
          onClick={() => load(true)}
          disabled={refreshing}
          className="btn-ghost text-xs px-3 py-1.5"
        >
          <RefreshCw size={12} className={refreshing ? 'animate-spin' : ''} /> Refresh
        </button>
      </div>

      {loading ? (
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="rounded-2xl border p-4" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <Skeleton className="h-4 w-3/4 mb-2" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
                <Skeleton className="h-5 w-16 rounded-full" />
              </div>
            </div>
          ))}
        </div>
      ) : messages.length === 0 ? (
        <div className="rounded-2xl border py-16 flex flex-col items-center text-center" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
          <div className="w-14 h-14 rounded-2xl bg-gray-800/60 flex items-center justify-center mb-4">
            <MessageSquare size={24} className="text-gray-600" />
          </div>
          <p className="text-sm font-medium text-gray-400 mb-1">No messages yet</p>
          <p className="text-xs text-gray-600">Send your first SMS via the API or the Send page</p>
        </div>
      ) : (
        <div className="space-y-2">
          {messages.map((msg: any) => {
            const s    = STATE_STYLE[msg.state] ?? { bg: 'bg-gray-500/10', text: 'text-gray-400', dot: 'bg-gray-400' };
            const open = expanded === msg.id;
            return (
              <div key={msg.id} className="rounded-2xl border overflow-hidden card-hover" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
                <button
                  onClick={() => setExpanded(e => e === msg.id ? null : msg.id)}
                  className="w-full flex items-start justify-between gap-4 px-4 py-3.5 text-left hover:bg-white/[0.02] transition-colors"
                >
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <span className={`mt-1 w-1.5 h-1.5 rounded-full shrink-0 ${s.dot}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white truncate font-medium">{msg.message}</p>
                      <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                        <span className="text-xs text-gray-600">{msg.phoneNumbers?.join(', ')}</span>
                        <span className="text-gray-700">·</span>
                        <span className="text-xs text-gray-600 flex items-center gap-1">
                          <Clock size={9} /> {new Date(msg.createdAt).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`text-[10px] font-semibold px-2.5 py-1 rounded-full ${s.bg} ${s.text}`}>{msg.state}</span>
                    {open ? <ChevronUp size={13} className="text-gray-600" /> : <ChevronDown size={13} className="text-gray-600" />}
                  </div>
                </button>

                {open && (
                  <div className="border-t px-4 py-3 space-y-2" style={{ borderColor: 'var(--border)', background: 'var(--bg-raised)' }}>
                    <p className="text-[10px] text-gray-700 font-mono">ID: {msg.id}</p>
                    {msg.recipients?.map((r: any, i: number) => {
                      const rs = STATE_STYLE[r.state] ?? { bg: 'bg-gray-500/10', text: 'text-gray-400', dot: 'bg-gray-400' };
                      return (
                        <div key={i} className="flex items-center justify-between text-xs py-1 border-b last:border-0" style={{ borderColor: 'var(--border)' }}>
                          <span className="text-gray-400">{r.phoneNumber}</span>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${rs.bg} ${rs.text}`}>{r.state}</span>
                        </div>
                      );
                    })}
                    {msg.isEncrypted && (
                      <p className="flex items-center gap-1.5 text-xs text-purple-400 pt-1">
                        <Lock size={10} /> End-to-end encrypted
                      </p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
