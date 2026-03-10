import { Response } from 'express';

// ─── Database Row Types ───────────────────────────────────────────────────────

export interface DeviceRow {
  id: string;
  name: string;
  login: string;
  password_hash: string;
  token: string;
  created_at: string;
  last_seen_at: string | null;
}

export interface ApiKeyRow {
  key: string;
  name: string;
  created_at: string;
}

export interface MessageRow {
  id: string;
  device_id: string | null;
  phone_numbers: string; // JSON
  message: string;
  state: MessageState;
  recipients: string; // JSON
  sim_number: number | null;
  is_encrypted: number; // SQLite boolean (0/1)
  created_at: string;
  updated_at: string;
}

// ─── Domain Types ─────────────────────────────────────────────────────────────

export type MessageState = 'Pending' | 'Processed' | 'Sent' | 'Delivered' | 'Failed';

export interface MessageRecipient {
  phoneNumber: string;
  state: MessageState;
  sentAt?: string;
  deliveredAt?: string;
  error?: string;
}

export interface Message {
  id: string;
  deviceId: string | null;
  phoneNumbers: string[];
  message: string;
  state: MessageState;
  recipients: MessageRecipient[];
  simNumber?: number;
  isEncrypted: boolean;
  createdAt: string;
  updatedAt: string;
}

// ─── SSE Types ────────────────────────────────────────────────────────────────

export interface ConnectedDevice {
  deviceId: string;
  res: Response;
  connectedAt: Date;
}

export interface SendCommand {
  id: string;
  type: 'send';
  phoneNumbers: string[];
  message: string;
  simNumber?: number;
  isEncrypted?: boolean;
}

// ─── Request Bodies ───────────────────────────────────────────────────────────

export interface SendMessageBody {
  phoneNumbers: string[];
  message: string;
  simNumber?: number;
  isEncrypted?: boolean;
  deviceId?: string;
  id?: string; // optional client-provided ID
}

export interface UpdateMessageBody {
  state: MessageState;
  recipients: MessageRecipient[];
}

export interface CreateDeviceBody {
  name: string;
  login: string;
  password: string;
}

export interface CreateApiKeyBody {
  name: string;
}

// ─── Express Augmentations ────────────────────────────────────────────────────

declare global {
  namespace Express {
    interface Request {
      device?: DeviceRow;
      apiKey?: ApiKeyRow;
    }
  }
}
