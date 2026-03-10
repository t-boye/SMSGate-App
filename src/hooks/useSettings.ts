import {useCallback, useEffect, useRef, useState} from 'react';
import {NativeModules} from 'react-native';
import {CloudSettings, LocalServerSettings, MessagesSettings, Webhook} from '../types';
import {settingsStore} from '../modules/settings/SettingsStore';
import {cloudClient} from '../modules/cloud/CloudClient';
import {startHttpServer, stopHttpServer} from '../modules/server/HttpServer';

const {ServiceManager: NativeServiceManager} = NativeModules;

export function useSettings() {
  const [cloud, setCloud] = useState<CloudSettings>({enabled: false, url: 'https://sms-gate-app.vercel.app', login: '', password: ''});
  const [localServer, setLocalServer] = useState<LocalServerSettings>({enabled: false, port: 8080, login: '', password: ''});
  const [messages, setMessages] = useState<MessagesSettings>({trackDelivery: true, simNumber: 1, validUntil: 86400});
  const [webhooks, setWebhooks] = useState<Webhook[]>([]);
  const [serverUrl, setServerUrl] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  const serverRunningRef = useRef(false);
  const stateRef = useRef({cloud, localServer, messages, webhooks});
  useEffect(() => {
    stateRef.current = {cloud, localServer, messages, webhooks};
  }, [cloud, localServer, messages, webhooks]);

  useEffect(() => {
    async function load() {
      const [c, l, m, w] = await Promise.all([
        settingsStore.loadCloud(),
        settingsStore.loadLocalServer(),
        settingsStore.loadMessages(),
        settingsStore.loadWebhooks(),
      ]);
      setCloud(c);
      setLocalServer(l);
      setMessages(m);
      setWebhooks(w);

      // Restore server URL if local server was previously enabled
      if (l.enabled && !serverRunningRef.current) {
        serverRunningRef.current = true;
        startHttpServer(l.port, l.login ?? '', l.password ?? '')
          .then(url => setServerUrl(url))
          .catch(e => {
            serverRunningRef.current = false;
            console.warn('[useSettings] Failed to restore local server:', e);
          });
      }

      setLoaded(true);
    }
    load();
  }, []); // run once on mount

  const save = useCallback(async () => {
    const {cloud: c, localServer: l, messages: m, webhooks: w} = stateRef.current;

    await Promise.all([
      settingsStore.saveCloud(c),
      settingsStore.saveLocalServer(l),
      settingsStore.saveMessages(m),
      settingsStore.saveWebhooks(w),
    ]);

    if (NativeServiceManager) {
      await NativeServiceManager.setAutoStart(c.enabled || l.enabled);
    }

    cloudClient.disconnect();
    if (c.enabled) await cloudClient.connect();

    if (l.enabled) {
      serverRunningRef.current = true;
      const url = await startHttpServer(l.port, l.login ?? '', l.password ?? '');
      setServerUrl(url);
    } else {
      serverRunningRef.current = false;
      await stopHttpServer();
      setServerUrl(null);
    }
  }, []);

  return {
    cloud, setCloud,
    localServer, setLocalServer,
    messages, setMessages,
    webhooks, setWebhooks,
    serverUrl, setServerUrl,
    loaded, save,
  };
}
