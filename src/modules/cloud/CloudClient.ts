import {NativeModules} from 'react-native';
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
  return btoa(str);
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
  private pollInterval = 5000;
  private simsReported = false;

  constructor() {
    this._schedulePoll(3000);
  }

  connect(): void {
    this.simsReported = false;
    this._schedulePoll(0);
  }

  private _schedulePoll(delay: number): void {
    if (this.pollTimer) clearTimeout(this.pollTimer);
    this.pollTimer = setTimeout(() => this._poll(), delay);
  }

  private async _poll(): Promise<void> {
    try {
      const settings = await settingsStore.loadCloud();
      const hasAuth  = (settings.login && settings.password) || settings.token;

      if (settings.enabled && settings.url && hasAuth) {
        const headers = buildHeaders(settings);

        // Report SIM cards once per connection so the server knows what SIMs are available
        if (!this.simsReported) {
          await this._reportSims(settings, headers);
          this.simsReported = true;
        }

        const res = await fetch(`${settings.url}/api/v1/messages/pending`, {headers});

        if (res.ok) {
          let jobs: PendingJob[];
          try { jobs = (await res.json()) as PendingJob[]; } catch { jobs = []; }

          await Promise.all(jobs.map(async job => {
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
                simSlot: job.simNumber != null ? job.simNumber - 1 : undefined,
              });
              await this._reportStatus(job.id, settings);
            } catch (e) {
              console.error('[CloudClient] Job failed:', e);
              try {
                const msg = messageStore.getMessage(job.id);
                if (!msg) {
                  messageStore.insertMessage({id: job.id, body: job.message, state: 'Failed', source: 'cloud'});
                }
                for (const phone of job.phoneNumbers) {
                  messageStore.insertRecipient({id: `${job.id}_fail`, messageId: job.id, phone, state: 'Failed'});
                }
                await this._reportStatus(job.id, settings);
              } catch {}
            }
          }));
        } else {
          console.error('[CloudClient] Poll failed:', res.status);
        }
      }
    } catch (e) {
      console.warn('[CloudClient] Poll error:', e);
    }

    this._schedulePoll(this.pollInterval);
  }

  private async _reportSims(settings: CloudSettings, headers: Record<string, string>): Promise<void> {
    try {
      const SmsSender = NativeModules.SmsSender;
      if (!SmsSender) return;

      const sims: any[] = await new Promise((resolve, reject) =>
        SmsSender.getSimCards((err: any, result: any) => err ? reject(err) : resolve(result))
      ).catch(() => []);

      if (!sims || sims.length === 0) return;

      await fetch(`${settings.url}/api/v1/devices/heartbeat`, {
        method: 'POST',
        headers,
        body: JSON.stringify({sims}),
      });
    } catch (e) {
      console.warn('[CloudClient] SIM report failed:', e);
    }
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
    if (this.pollTimer) clearTimeout(this.pollTimer);
    this.pollTimer = null;
    this.simsReported = false;
  }
}

export const cloudClient = new CloudClient();
