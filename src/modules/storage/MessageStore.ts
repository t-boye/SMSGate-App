import AsyncStorage from '@react-native-async-storage/async-storage';
import {Message, MessageState, MessageRecipient} from '../../types';

const STORAGE_KEY = 'smsgate:messages';
const MAX_MESSAGES = 500;

interface StoredMessage extends Message {
  recipients: MessageRecipient[];
}

class MessageStore {
  private messages: Map<string, StoredMessage> = new Map();
  private orderedIds: string[] = [];

  async initialize(): Promise<void> {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (raw) {
        const list: StoredMessage[] = JSON.parse(raw);
        for (const msg of list) {
          this.messages.set(msg.id, msg);
        }
        this.orderedIds = list.map(m => m.id);
      }
    } catch (e) {
      console.error('[MessageStore] Failed to load from storage:', e);
    }
  }

  private persist(): void {
    const list = this.orderedIds
      .slice(0, MAX_MESSAGES)
      .map(id => this.messages.get(id))
      .filter(Boolean) as StoredMessage[];
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(list)).catch(e =>
      console.error('[MessageStore] Failed to save:', e),
    );
  }

  insertMessage(msg: {
    id: string;
    body: string;
    state?: MessageState;
    simNumber?: number;
    isEncrypted?: boolean;
    source?: 'local' | 'cloud' | 'http';
  }): void {
    const now = new Date().toISOString();
    const existing = this.messages.get(msg.id);
    const stored: StoredMessage = {
      id: msg.id,
      message: msg.body,
      phoneNumbers: existing?.phoneNumbers ?? [],
      recipients: existing?.recipients ?? [],
      state: msg.state ?? 'Pending',
      createdAt: existing?.createdAt ?? now,
      isEncrypted: msg.isEncrypted ?? false,
      simNumber: msg.simNumber,
      source: msg.source ?? 'local',
    };
    if (!existing) {
      this.orderedIds.unshift(msg.id);
      if (this.orderedIds.length > MAX_MESSAGES) {
        const removed = this.orderedIds.pop();
        if (removed) this.messages.delete(removed);
      }
    }
    this.messages.set(msg.id, stored);
    this.persist();
  }

  insertRecipient(r: {id: string; messageId: string; phone: string; state?: MessageState}): void {
    const msg = this.messages.get(r.messageId);
    if (!msg) return;
    const existingIdx = msg.recipients.findIndex(rec => rec.id === r.id);
    const recipient: MessageRecipient = {
      id: r.id,
      phoneNumber: r.phone,
      state: r.state ?? 'Pending',
    };
    if (existingIdx >= 0) {
      msg.recipients[existingIdx] = recipient;
    } else {
      msg.recipients.push(recipient);
    }
    msg.phoneNumbers = msg.recipients.map(rec => rec.phoneNumber);
    this.persist();
  }

  updateRecipientState(recipientId: string, state: MessageState, error?: string): void {
    for (const msg of this.messages.values()) {
      const idx = msg.recipients.findIndex(r => r.id === recipientId);
      if (idx >= 0) {
        const rec = msg.recipients[idx];
        rec.state = state;
        if (error !== undefined) rec.error = error;
        if (state === 'Sent') rec.sentAt = Date.now();
        if (state === 'Delivered') rec.deliveredAt = Date.now();
        this.recomputeMessageState(msg.id);
        this.persist();
        return;
      }
    }
  }

  recomputeMessageState(messageId: string): void {
    const msg = this.messages.get(messageId);
    if (!msg) return;
    const states = msg.recipients.map(r => r.state);
    let overall: MessageState = 'Pending';
    if (states.length > 0) {
      if (states.every(s => s === 'Delivered')) overall = 'Delivered';
      else if (states.every(s => s === 'Failed')) overall = 'Failed';
      else if (states.some(s => s === 'Delivered' || s === 'Sent')) overall = 'Sent';
      else if (states.some(s => s === 'Failed')) overall = 'Failed';
    }
    msg.state = overall;
  }

  getMessage(id: string): Message | null {
    const msg = this.messages.get(id);
    if (!msg) return null;
    return {...msg};
  }

  listMessages(limit: number = 50, offset: number = 0): Message[] {
    return this.orderedIds
      .slice(offset, offset + limit)
      .map(id => this.getMessage(id))
      .filter(Boolean) as Message[];
  }

  getStats() {
    const stats = {pending: 0, processed: 0, sent: 0, delivered: 0, failed: 0};
    for (const msg of this.messages.values()) {
      const state = msg.state.toLowerCase() as keyof typeof stats;
      if (state in stats) stats[state]++;
    }
    return stats;
  }
}

export const messageStore = new MessageStore();
