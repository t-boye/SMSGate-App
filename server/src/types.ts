import { Response } from 'express';

// ─── Plans ────────────────────────────────────────────────────────────────────

export const PLANS = {
  free:     { name: 'Free',     smsLimit: 100,    price: 0,   paystackCode: '' },
  basic:    { name: 'Basic',    smsLimit: 5_000,  price: 15,  paystackCode: process.env.PAYSTACK_BASIC_PLAN_CODE    ?? '' },
  pro:      { name: 'Pro',      smsLimit: 30_000, price: 49,  paystackCode: process.env.PAYSTACK_PRO_PLAN_CODE      ?? '' },
  business: { name: 'Business', smsLimit: -1,     price: 149, paystackCode: process.env.PAYSTACK_BUSINESS_PLAN_CODE ?? '' },
} as const;

export type PlanName = keyof typeof PLANS;

// ─── Database Row Types ───────────────────────────────────────────────────────

export interface UserRow {
  id: string;
  email: string;
  name: string;
  password_hash: string;
  plan: PlanName;
  sms_used_month: number;
  sms_reset_at: string;
  paystack_customer_code: string | null;
  paystack_subscription_code: string | null;
  created_at: string;
}

export interface DeviceRow {
  id: string;
  user_id: string | null;
  name: string;
  login: string;
  password_hash: string;
  token: string;
  created_at: string;
  last_seen_at: string | null;
}

export interface ApiKeyRow {
  key: string;
  user_id: string | null;
  name: string;
  created_at: string;
}

export interface MessageRow {
  id: string;
  user_id: string | null;
  device_id: string | null;
  phone_numbers: string;
  message: string;
  state: MessageState;
  recipients: string;
  sim_number: number | null;
  is_encrypted: number;
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
  userId: string | null;
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

// ─── SSE / Command Types ──────────────────────────────────────────────────────

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

export interface RegisterUserBody {
  email: string;
  name: string;
  password: string;
}

export interface LoginUserBody {
  email: string;
  password: string;
}

export interface SendMessageBody {
  phoneNumbers: string[];
  message: string;
  simNumber?: number;
  isEncrypted?: boolean;
  deviceId?: string;
  id?: string;
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
      user?: UserRow;
    }
  }
}
