export type MessageState = 'Pending' | 'Processed' | 'Sent' | 'Delivered' | 'Failed';

export interface MessageRecipient {
  id?: string;
  phoneNumber: string;
  state: MessageState;
  error?: string;
  sentAt?: number;
  deliveredAt?: number;
}

export interface Message {
  id: string;
  message: string;
  phoneNumbers: string[];
  recipients: MessageRecipient[];
  state: MessageState;
  createdAt: string;
  isEncrypted?: boolean;
  simNumber?: number;
  source?: 'local' | 'cloud' | 'http';
}

export interface MessagesStats {
  pending: number;
  processed: number;
  sent: number;
  delivered: number;
  failed: number;
}

export interface CloudSettings {
  enabled: boolean;
  url?: string;
  login?: string;
  password?: string;
  token?: string;
}

export interface LocalServerSettings {
  enabled: boolean;
  port: number;
  login?: string;
  password?: string;
}

export interface MessagesSettings {
  simNumber?: number;
  validUntil?: number;
  trackDelivery: boolean;
}

export interface Webhook {
  id: string;
  url: string;
  event: string;
}
