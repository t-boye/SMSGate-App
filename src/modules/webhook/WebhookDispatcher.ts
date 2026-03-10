import {settingsStore} from '../settings/SettingsStore';

class WebhookDispatcher {
  async dispatch(event: string, payload: unknown): Promise<void> {
    const webhooks = await settingsStore.loadWebhooks();
    const matching = webhooks.filter(
      w => w.url.trim() && (w.event === event || w.event === '*'),
    );
    if (matching.length === 0) return;

    const results = await Promise.allSettled(
      matching.map(webhook =>
        fetch(webhook.url, {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({event, payload, timestamp: Date.now()}),
        }).then(r => {
          if (!r.ok) throw new Error(`HTTP ${r.status} from ${webhook.url}`);
        }),
      ),
    );

    results.forEach((result, i) => {
      if (result.status === 'rejected') {
        console.warn(`[WebhookDispatcher] Webhook "${matching[i].url}" failed:`, result.reason);
      }
    });
  }
}

export const webhookDispatcher = new WebhookDispatcher();
