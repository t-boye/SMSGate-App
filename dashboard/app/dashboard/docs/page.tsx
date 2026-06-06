'use client';
import { useState } from 'react';
import { Copy, Check, ChevronDown, ChevronUp } from 'lucide-react';

const BASE = typeof window !== 'undefined'
  ? (process.env.NEXT_PUBLIC_API_URL ?? window.location.origin)
  : 'https://your-server.com';

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  function copy() {
    navigator.clipboard.writeText(text);
    setCopied(true); setTimeout(() => setCopied(false), 2000);
  }
  return (
    <button onClick={copy} className="p-1.5 rounded-md transition-colors hover:bg-white/[0.06]" title="Copy">
      {copied ? <Check size={12} className="text-green-400" /> : <Copy size={12} className="text-gray-600 hover:text-gray-300" />}
    </button>
  );
}

function CodeBlock({ code, lang = '' }: { code: string; lang?: string }) {
  return (
    <div className="rounded-xl overflow-hidden border" style={{ background: 'var(--bg-raised)', borderColor: 'var(--border)' }}>
      <div className="flex items-center justify-between px-4 py-2 border-b" style={{ borderColor: 'var(--border)' }}>
        <span className="text-[10px] text-gray-600 font-mono uppercase tracking-wider">{lang}</span>
        <CopyButton text={code} />
      </div>
      <pre className="px-4 py-3.5 text-xs text-green-300 font-mono overflow-x-auto whitespace-pre leading-relaxed">{code.trim()}</pre>
    </div>
  );
}

function MethodBadge({ method }: { method: string }) {
  const colors: Record<string, string> = {
    GET:   'bg-blue-500/10 text-blue-400 border-blue-500/20',
    POST:  'bg-green-500/10 text-green-400 border-green-500/20',
    PATCH: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  };
  return (
    <span className={`text-[9px] font-black px-1.5 py-0.5 rounded border tracking-wider ${colors[method] ?? 'bg-gray-500/10 text-gray-400 border-gray-500/20'}`}>
      {method}
    </span>
  );
}

function Endpoint({ method, path, desc, children }: {
  method: string; path: string; desc: string; children?: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-xl border overflow-hidden card-hover" style={{ borderColor: 'var(--border)' }}>
      <button onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-white/[0.02] transition-colors">
        <MethodBadge method={method} />
        <code className="text-sm text-white font-mono">{path}</code>
        <span className="text-xs text-gray-600 ml-auto hidden sm:block">{desc}</span>
        {open ? <ChevronUp size={12} className="text-gray-600 shrink-0" /> : <ChevronDown size={12} className="text-gray-600 shrink-0" />}
      </button>
      {open && children && (
        <div className="border-t px-4 py-4 space-y-3" style={{ borderColor: 'var(--border)', background: 'var(--bg-raised)' }}>
          <p className="text-xs text-gray-500">{desc}</p>
          {children}
        </div>
      )}
    </div>
  );
}

export default function DocsPage() {
  return (
    <div className="max-w-3xl space-y-10 pb-12">
      <div>
        <h1 className="text-xl font-bold text-white">API Reference</h1>
        <p className="text-sm text-gray-500 mt-1">
          REST API for sending SMS through your gateway.
          Base URL: <code className="text-green-400 text-xs ml-1">{BASE}</code>
        </p>
      </div>

      {/* Auth */}
      <section className="space-y-3">
        <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Authentication</h2>
        <div className="rounded-2xl border p-5 space-y-4" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
          <p className="text-sm text-gray-400">
            Every request needs a <code className="text-green-300 text-xs bg-green-500/10 px-1.5 py-0.5 rounded">Bearer</code> token in the{' '}
            <code className="text-green-300 text-xs bg-green-500/10 px-1.5 py-0.5 rounded">Authorization</code> header.
            Get yours from <strong className="text-white">API Keys</strong> in the dashboard.
          </p>
          <CodeBlock lang="http" code="Authorization: Bearer YOUR_API_KEY" />
        </div>
      </section>

      {/* Quick start */}
      <section className="space-y-3">
        <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Quick Start</h2>
        <div className="rounded-2xl border p-5 space-y-5" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
          <div>
            <p className="text-sm font-semibold text-white mb-2">1. List devices &amp; SIM cards</p>
            <CodeBlock lang="curl" code={`curl ${BASE}/api/v1/devices \\
  -H "Authorization: Bearer YOUR_API_KEY"`} />
          </div>
          <div>
            <p className="text-sm font-semibold text-white mb-2">2. Send an SMS</p>
            <CodeBlock lang="curl" code={`curl -X POST ${BASE}/api/v1/messages \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"message":"Hello!","phoneNumbers":["+233244000000"],"simNumber":1}'`} />
          </div>
          <div>
            <p className="text-sm font-semibold text-white mb-2">3. Check delivery status</p>
            <CodeBlock lang="curl" code={`curl ${BASE}/api/v1/messages/MESSAGE_ID \\
  -H "Authorization: Bearer YOUR_API_KEY"`} />
          </div>
        </div>
      </section>

      {/* Code examples */}
      <section className="space-y-3">
        <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Code Examples</h2>
        <div className="space-y-3">
          <p className="text-xs font-semibold text-gray-500">JavaScript</p>
          <CodeBlock lang="javascript" code={`const res = await fetch('${BASE}/api/v1/messages', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY',
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    message: 'Hello from SMSGate!',
    phoneNumbers: ['+233244000000'],
    simNumber: 1,
  }),
});
const { id, status } = await res.json();`} />

          <p className="text-xs font-semibold text-gray-500">Python</p>
          <CodeBlock lang="python" code={`import requests

r = requests.post(
    '${BASE}/api/v1/messages',
    headers={'Authorization': 'Bearer YOUR_API_KEY'},
    json={'message': 'Hello!', 'phoneNumbers': ['+233244000000'], 'simNumber': 1}
)
print(r.json()['id'])`} />

          <p className="text-xs font-semibold text-gray-500">PHP</p>
          <CodeBlock lang="php" code={`$ch = curl_init('${BASE}/api/v1/messages');
curl_setopt_array($ch, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_POST => true,
    CURLOPT_HTTPHEADER => ['Authorization: Bearer YOUR_API_KEY', 'Content-Type: application/json'],
    CURLOPT_POSTFIELDS => json_encode(['message' => 'Hello!', 'phoneNumbers' => ['+233244000000']]),
]);
echo curl_exec($ch);`} />
        </div>
      </section>

      {/* Endpoints */}
      <section className="space-y-3">
        <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Endpoints</h2>
        <div className="space-y-2">
          <Endpoint method="POST" path="/api/v1/messages" desc="Send an SMS">
            <CodeBlock lang="json" code={`{
  "message":      "Your text",           // required
  "phoneNumbers": ["+233244000000"],      // required
  "simNumber":    1,                     // optional — 1 or 2
  "deviceId":     "abc123"               // optional
}`} />
            <CodeBlock lang="json" code={`{ "id": "uuid", "status": "queued" }`} />
          </Endpoint>

          <Endpoint method="GET" path="/api/v1/messages" desc="List messages (last 50)">
            <CodeBlock lang="json" code={`[{
  "id": "uuid",
  "message": "Hello!",
  "phoneNumbers": ["+233244000000"],
  "state": "Delivered",
  "recipients": [{ "phoneNumber": "+233244000000", "state": "Delivered" }],
  "createdAt": "2024-01-01T00:00:00.000Z"
}]`} />
          </Endpoint>

          <Endpoint method="GET" path="/api/v1/messages/:id" desc="Get message + delivery status">
            <CodeBlock lang="json" code={`{ "id": "uuid", "state": "Delivered", "recipients": [...] }`} />
          </Endpoint>

          <Endpoint method="GET" path="/api/v1/devices" desc="List devices and SIM cards">
            <CodeBlock lang="json" code={`[{
  "id": "device-uuid",
  "name": "My Phone",
  "isOnline": true,
  "sims": [{ "slotIndex": 0, "displayName": "MTN Ghana", "phoneNumber": "+233244000000" }]
}]`} />
          </Endpoint>

          <Endpoint method="GET" path="/health" desc="Server health check">
            <CodeBlock lang="json" code={`{ "status": "ok", "timestamp": "..." }`} />
          </Endpoint>
        </div>
      </section>

      {/* States */}
      <section className="space-y-3">
        <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Message States</h2>
        <div className="rounded-2xl border overflow-hidden" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
          {[
            ['Pending',   'yellow', 'Queued — waiting for a device to pick it up'],
            ['Processed', 'blue',   'Device claimed it and is sending'],
            ['Sent',      'green',  'Handed off to the carrier'],
            ['Delivered', 'green',  'Delivery receipt confirmed'],
            ['Failed',    'red',    'Could not be sent — check the device is online'],
          ].map(([state, color, desc]) => (
            <div key={state} className="flex items-start gap-4 px-5 py-3.5 border-b last:border-0 text-sm" style={{ borderColor: 'var(--border)' }}>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0 bg-${color}-500/10 text-${color}-400`}>{state}</span>
              <span className="text-gray-500">{desc}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Rate limits */}
      <section className="space-y-3">
        <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Rate Limits</h2>
        <div className="rounded-2xl border p-5" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
          <p className="text-sm text-gray-400 mb-3">SMS quotas reset each calendar month. Exceeding returns:</p>
          <CodeBlock lang="json" code={`HTTP 429
{ "error": "Monthly SMS limit reached", "plan": "free", "limit": 100, "used": 100 }`} />
        </div>
      </section>
    </div>
  );
}
