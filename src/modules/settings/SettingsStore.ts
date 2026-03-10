import AsyncStorage from '@react-native-async-storage/async-storage';
import {CloudSettings, LocalServerSettings, MessagesSettings, Webhook} from '../../types';

const KEYS = {
  CLOUD: '@smsgate/cloud',
  LOCAL_SERVER: '@smsgate/localServer',
  MESSAGES: '@smsgate/messages',
  WEBHOOKS: '@smsgate/webhooks',
  ENCRYPTION_KEY: '@smsgate/encryptionKey',
} as const;

const defaults = {
  cloud: (): CloudSettings => ({enabled: false, url: 'https://sms-gate-app.vercel.app', login: '', password: ''}),
  localServer: (): LocalServerSettings => ({enabled: false, port: 8080, login: '', password: ''}),
  messages: (): MessagesSettings => ({trackDelivery: true, simNumber: 1, validUntil: 86400}),
  webhooks: (): Webhook[] => [],
};

async function load<T>(key: string, fallback: () => T): Promise<T> {
  try {
    const raw = await AsyncStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback();
  } catch {
    return fallback();
  }
}

async function save<T>(key: string, value: T): Promise<void> {
  await AsyncStorage.setItem(key, JSON.stringify(value));
}

export const settingsStore = {
  loadCloud: () => load(KEYS.CLOUD, defaults.cloud),
  saveCloud: (s: CloudSettings) => save(KEYS.CLOUD, s),

  loadLocalServer: () => load(KEYS.LOCAL_SERVER, defaults.localServer),
  saveLocalServer: (s: LocalServerSettings) => save(KEYS.LOCAL_SERVER, s),

  loadMessages: () => load(KEYS.MESSAGES, defaults.messages),
  saveMessages: (s: MessagesSettings) => save(KEYS.MESSAGES, s),

  loadWebhooks: () => load<Webhook[]>(KEYS.WEBHOOKS, defaults.webhooks),
  saveWebhooks: (w: Webhook[]) => save(KEYS.WEBHOOKS, w),

  loadEncryptionKey: () => load<string | null>(KEYS.ENCRYPTION_KEY, () => null),
  saveEncryptionKey: (key: string) => save(KEYS.ENCRYPTION_KEY, key),
};
