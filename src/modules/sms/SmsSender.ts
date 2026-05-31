import {NativeModules} from 'react-native';
import {messageStore} from '../storage/MessageStore';
import {settingsStore} from '../settings/SettingsStore';
import {webhookDispatcher} from '../webhook/WebhookDispatcher';
import {Encryption} from '../crypto/Encryption';

function generateId(): string {
  return `${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

export async function sendSms(params: {
  messageId: string;
  phoneNumbers: string[];
  body: string;
  simSlot?: number;
  isEncrypted?: boolean;
}): Promise<void> {
  let _s = 'native';
  try {
    const NativeSmsSender = NativeModules.SmsSender;
    if (!NativeSmsSender) throw new Error('SmsSender native module not available');

    // Log what methods the native module exposes
    console.log('[SmsSender] native keys:', Object.keys(NativeSmsSender).join(','));
    console.log('[SmsSender] sendSms type:', typeof NativeSmsSender.sendSms);

    _s = 'settings';
    const msgSettings = await settingsStore.loadMessages();
    const simSlot = params.simSlot ?? (msgSettings.simNumber ?? 1) - 1;

    let bodyToSend = params.body;
    if (params.isEncrypted) {
      _s = 'encrypt';
      const encKey = await settingsStore.loadEncryptionKey();
      if (encKey) bodyToSend = Encryption.encrypt(params.body, encKey);
    }

    _s = 'insertRecipients';
    const recipientIds: string[] = [];
    for (const phone of params.phoneNumbers) {
      const recipientId = generateId();
      recipientIds.push(recipientId);
      messageStore.insertRecipient({id: recipientId, messageId: params.messageId, phone, state: 'Pending'});
    }

    _s = 'nativeSend';
    for (let i = 0; i < params.phoneNumbers.length; i++) {
      const phone = params.phoneNumbers[i];
      const recipientId = recipientIds[i];
      try {
        await NativeSmsSender.sendSms(
          params.messageId, recipientId, phone, bodyToSend, simSlot, msgSettings.trackDelivery,
        );
      } catch (e: any) {
        _s = 'updateState';
        messageStore.updateRecipientState(recipientId, 'Failed', e?.message ?? 'Send failed');
      }
    }

    _s = 'webhook';
    await webhookDispatcher.dispatch('sms:sent', {messageId: params.messageId, phoneNumbers: params.phoneNumbers});

    _s = 'done';
  } catch (e) {
    console.error(`[SmsSender] failed at step "${_s}":`, e);
    throw e;
  }
}

export async function getSimCards(): Promise<any[]> {
  const NativeSmsSender = NativeModules.SmsSender;
  if (!NativeSmsSender) return [];
  return NativeSmsSender.getSimCards();
}
