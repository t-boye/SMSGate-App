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
  const NativeSmsSender = NativeModules.SmsSender;
  if (!NativeSmsSender) {
    throw new Error('SmsSender native module not available');
  }

  const msgSettings = await settingsStore.loadMessages();
  const simSlot = params.simSlot ?? (msgSettings.simNumber ?? 1) - 1;

  // Encrypt the body if an encryption key is configured
  let bodyToSend = params.body;
  if (params.isEncrypted) {
    const encKey = await settingsStore.loadEncryptionKey();
    if (encKey) {
      bodyToSend = Encryption.encrypt(params.body, encKey);
    }
  }

  // Insert all recipients as Pending
  const recipientIds: string[] = [];
  for (const phone of params.phoneNumbers) {
    const recipientId = generateId();
    recipientIds.push(recipientId);
    messageStore.insertRecipient({
      id: recipientId,
      messageId: params.messageId,
      phone,
      state: 'Pending',
    });
  }

  // Send to each recipient
  for (let i = 0; i < params.phoneNumbers.length; i++) {
    const phone = params.phoneNumbers[i];
    const recipientId = recipientIds[i];
    try {
      await NativeSmsSender.sendSms(
        params.messageId,
        recipientId,
        phone,
        bodyToSend,
        simSlot,
        msgSettings.trackDelivery,
      );
      // Actual state (Sent/Failed) comes from onDeliveryUpdate native event
    } catch (e: any) {
      messageStore.updateRecipientState(recipientId, 'Failed', e?.message ?? 'Send failed');
    }
  }

  await webhookDispatcher.dispatch('sms:sent', {
    messageId: params.messageId,
    phoneNumbers: params.phoneNumbers,
  });
}

export async function getSimCards(): Promise<any[]> {
  const NativeSmsSender = NativeModules.SmsSender;
  if (!NativeSmsSender) return [];
  return NativeSmsSender.getSimCards();
}
