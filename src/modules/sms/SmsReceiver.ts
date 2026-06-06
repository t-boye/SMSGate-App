import {NativeEventEmitter, NativeModules} from 'react-native';
import {messageStore} from '../storage/MessageStore';
import {webhookDispatcher} from '../webhook/WebhookDispatcher';
import {cloudClient} from '../cloud/CloudClient';

const {SmsReceiver: NativeSmsReceiver} = NativeModules;

function generateId(): string {
  return `${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

// Dedup cache: prevents duplicate webhook dispatches when Android re-delivers
// the same SMS broadcast (e.g. dual-SIM, ordered broadcast retry).
const recentSmsKeys = new Map<string, number>();
const DEDUP_TTL_MS = 30_000;

function isDuplicate(from: string, timestamp: number): boolean {
  const key = `${from}__${timestamp}`;
  const now = Date.now();
  // Evict stale entries
  for (const [k, t] of recentSmsKeys) {
    if (now - t > DEDUP_TTL_MS) recentSmsKeys.delete(k);
  }
  if (recentSmsKeys.has(key)) return true;
  recentSmsKeys.set(key, now);
  return false;
}

export function startListening(): () => void {
  if (!NativeSmsReceiver) {
    console.warn('[SmsReceiver] Native module not available — SMS receiving disabled');
    return () => {};
  }

  const emitter = new NativeEventEmitter(NativeSmsReceiver);

  const smsSubscription = emitter.addListener(
    'onSmsReceived',
    async (event: {from: string; body: string; timestamp: number}) => {
      try {
        if (isDuplicate(event.from, event.timestamp)) return;
        const id = generateId();
        const recipientId = generateId();
        messageStore.insertMessage({id, body: event.body, state: 'Delivered', source: 'local'});
        messageStore.insertRecipient({id: recipientId, messageId: id, phone: event.from, state: 'Delivered'});
        await webhookDispatcher.dispatch('sms:received', {
          from: event.from,
          body: event.body,
          timestamp: event.timestamp,
        });
      } catch (e) {
        console.error('[SmsReceiver] Error handling incoming SMS:', e);
      }
    },
  );

  const deliverySubscription = emitter.addListener(
    'onDeliveryUpdate',
    async (event: {
      messageId: string;
      recipientId: string;
      status: 'sent' | 'delivered' | 'failed';
      error?: string;
    }) => {
      try {
        const stateMap = {sent: 'Sent', delivered: 'Delivered', failed: 'Failed'} as const;
        const state = stateMap[event.status] ?? 'Failed';
        messageStore.updateRecipientState(event.recipientId, state, event.error);

        const webhookEvent =
          event.status === 'delivered' ? 'sms:delivered' :
          event.status === 'failed'    ? 'sms:failed'    : null;
        await cloudClient.reportStatus(event.messageId).catch(() => {});

        if (webhookEvent) {
          const msg = messageStore.getMessage(event.messageId);
          const recipient = msg?.recipients.find(r => r.id === event.recipientId);
          await webhookDispatcher.dispatch(webhookEvent, {
            messageId: event.messageId,
            phone: recipient?.phoneNumber,
            status: event.status,
            error: event.error,
          });
        }
      } catch (e) {
        console.error('[SmsReceiver] Error handling delivery update:', e);
      }
    },
  );

  return () => {
    smsSubscription.remove();
    deliverySubscription.remove();
  };
}
