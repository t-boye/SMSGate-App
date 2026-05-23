import {messageStore} from '../storage/MessageStore';
import {sendSms} from '../sms/SmsSender';
import {settingsStore} from '../settings/SettingsStore';
import {CloudSettings} from '../../types';

type PendingJob = {
  id: string;
  type: 'send';
  phoneNumbers: string[];
  message: string;
  simNumber?: number;
  isEncrypted?: boolean;
};

function toBase64(str: string): string {
  return Buffer.from(str, 'utf8').toString('base64');
}

function buildHeaders(settings: CloudSettings): Record<string, string> {
  const headers: Record<string, string> = {'Content-Type': 'application/json'};
  if (settings.login && settings.password) {
    headers['Authorization'] = `Basic ${toBase64(`${settings.login}:${settings.password}`)}`;
  } else if (settings.token) {
    headers['Authorization'] = `Bearer ${settings.token}`;
  }
  return headers;
}

class CloudClient {
  private pollTimer: ReturnType<typeof setTimeout> | null = null;
  private pollInterval = 5000; // ms between polls
  private running = false;

  async connect(): Promise<void> {
    this.running = true;
    this._schedulePoll(0); // poll immediately on connect
  }

  private _schedulePoll(delay: number): void {
    if (this.pollTimer) clearTimeout(this.pollTimer);
    this.pollTimer = setTimeout(() => this._poll(), delay);
  }

  private async _poll(): Promise<void> {
    if (!this.running) return;

    try {
      const settings = await settingsStore.loadCloud();
      if (!settings.enabled || !settings.url) return;

      const headers = buildHeaders(settings);

      // Fetch pending jobs claimed for this device
      const res = await fetch(`${settings.url}/api/v1/messages/pending`, {headers});

      if (!res.ok) {
        console.warn('[CloudClient] Poll failed:', res.status);
        this._schedulePoll(this.pollInterval);
        return;
      }

      let jobs: PendingJob[];
      try {
        jobs = (await res.json()) as PendingJob[];
      } catch {
        console.warn('[CloudClient] Invalid JSON from server');
        this._schedulePoll(this.pollInterval);
        return;
      }

      // Process each job in parallel
      await Promise.all(
        jobs.map(async job => {
          if (job.type !== 'send') return;
          try {
            messageStore.insertMessage({
              id: job.id,
              body: job.message,
              isEncrypted: job.isEncrypted,
              source: 'cloud',
            });
            await sendSms({
              messageId: job.id,
              phoneNumbers: job.phoneNumbers,
              body: job.message,
              simSlot: job.simNumber ? job.simNumber - 1 : undefined,
            });
            await this._reportStatus(job.id, settings);
          } catch (e) {
            console.error('[CloudClient] Job processing failed:', e);
          }
        }),
      );
    } catch (e) {
      console.warn('[CloudClient] Poll error:', e);
    }

    this._schedulePoll(this.pollInterval);
  }

  private async _reportStatus(messageId: string, settings: CloudSettings): Promise<void> {
    try {
      const msg = messageStore.getMessage(messageId);
      if (!msg) return;
      const headers = buildHeaders(settings);
      await fetch(`${settings.url}/api/v1/messages/${messageId}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({state: msg.state, recipients: msg.recipients}),
      });
    } catch (e) {
      console.warn('[CloudClient] Status report failed:', e);
    }
  }

  disconnect(): void {
    this.running = false;
    if (this.pollTimer) clearTimeout(this.pollTimer);
    this.pollTimer = null;
  }
}

export const cloudClient = new CloudClient();
