import {NativeEventEmitter, NativeModules} from 'react-native';
import {messageStore} from '../storage/MessageStore';
import {sendSms} from '../sms/SmsSender';

const {HttpServer: NativeHttpServer} = NativeModules;

function generateId(): string {
  return `${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

type HttpRequest = {
  requestId: string;
  method: string;
  path: string;
  body: string;
};

async function handleSendMessage(body: string, source: 'http'): Promise<{status: number; body: string}> {
  let parsed: any;
  try {
    parsed = JSON.parse(body);
  } catch {
    return {status: 400, body: JSON.stringify({error: 'Invalid JSON body'})};
  }
  const {message, phoneNumbers, id: clientId, simNumber} = parsed;
  if (!message || !Array.isArray(phoneNumbers) || phoneNumbers.length === 0) {
    return {
      status: 400,
      body: JSON.stringify({error: 'Fields required: message (string), phoneNumbers (array)'}),
    };
  }
  const messageId = clientId ?? generateId();
  messageStore.insertMessage({id: messageId, body: message, source});
  sendSms({
    messageId,
    phoneNumbers,
    body: message,
    simSlot: simNumber ? simNumber - 1 : undefined,
  }).catch(e => console.error('[HttpServer] sendSms failed:', e));
  // Return { id } — compatible with both our API and the gateway's expected format
  return {status: 200, body: JSON.stringify({id: messageId})};
}

async function handleRequest(req: HttpRequest): Promise<{status: number; body: string}> {
  const {method, path, body} = req;

  // ── Health checks (both paths) ──────────────────────────────────────────────
  if (method === 'GET' && (path === '/health' || path === '/api/v1/health')) {
    return {status: 200, body: JSON.stringify({status: 'ok', timestamp: Date.now()})};
  }

  // ── Send SMS — original path ────────────────────────────────────────────────
  if (method === 'POST' && path === '/message') {
    return handleSendMessage(body, 'http');
  }

  // ── Send SMS — gateway-compatible path ─────────────────────────────────────
  // Called by the existing backend when using Option A (Cloudflare Tunnel direct)
  if (method === 'POST' && path === '/api/v1/message') {
    return handleSendMessage(body, 'http');
  }

  // ── List messages ───────────────────────────────────────────────────────────
  if (method === 'GET' && path === '/messages') {
    const msgs = messageStore.listMessages(50, 0);
    return {status: 200, body: JSON.stringify(msgs)};
  }

  // ── Get single message ──────────────────────────────────────────────────────
  const msgMatch = path.match(/^\/(?:api\/v1\/)?message\/([^/]+)$/);
  if (method === 'GET' && msgMatch) {
    const msg = messageStore.getMessage(msgMatch[1]);
    if (!msg) return {status: 404, body: JSON.stringify({error: 'Not found'})};
    return {status: 200, body: JSON.stringify(msg)};
  }

  return {status: 404, body: JSON.stringify({error: 'Not found'})};
}

let requestSubscription: ReturnType<typeof NativeEventEmitter.prototype.addListener> | null = null;

export async function startHttpServer(
  port: number,
  username: string,
  password: string,
): Promise<string> {
  if (!NativeHttpServer) {
    throw new Error('HttpServer native module not available');
  }

  requestSubscription?.remove();
  const emitter = new NativeEventEmitter(NativeHttpServer);
  requestSubscription = emitter.addListener(
    'onHttpRequest',
    async (req: HttpRequest) => {
      const {status, body} = await handleRequest(req).catch(e => ({
        status: 500,
        body: JSON.stringify({error: String(e)}),
      }));
      NativeHttpServer.respondToRequest(req.requestId, status, body).catch(
        (e: any) => console.error('[HttpServer] respondToRequest failed:', e),
      );
    },
  );
  const url: string = await NativeHttpServer.start(port, username, password);
  return url;
}

export async function stopHttpServer(): Promise<void> {
  requestSubscription?.remove();
  requestSubscription = null;
  if (NativeHttpServer) await NativeHttpServer.stop();
}
