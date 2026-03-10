import React, {useEffect, useRef} from 'react';
import {StatusBar, NativeModules, Alert, Platform} from 'react-native';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import AppNavigator from './src/navigation/AppNavigator';
import {messageStore} from './src/modules/storage/MessageStore';
import {settingsStore} from './src/modules/settings/SettingsStore';
import {startListening} from './src/modules/sms/SmsReceiver';
import {cloudClient} from './src/modules/cloud/CloudClient';
import {startHttpServer} from './src/modules/server/HttpServer';

const {ServiceManager: NativeServiceManager} = NativeModules;

async function requestPermissions(): Promise<void> {
  if (Platform.OS !== 'android') return;
  const {PermissionsAndroid} = await import('react-native');

  const toRequest = [
    PermissionsAndroid.PERMISSIONS.SEND_SMS,
    PermissionsAndroid.PERMISSIONS.RECEIVE_SMS,
    PermissionsAndroid.PERMISSIONS.READ_SMS,
    PermissionsAndroid.PERMISSIONS.READ_PHONE_STATE,
  ] as const;

  // POST_NOTIFICATIONS (Android 13+)
  if (Platform.Version >= 33) {
    await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
    ).catch(() => {});
  }

  const results = await PermissionsAndroid.requestMultiple([...toRequest]);
  const denied = toRequest.filter(
    p => results[p] !== PermissionsAndroid.RESULTS.GRANTED,
  );
  if (denied.length > 0) {
    Alert.alert(
      'Permissions Required',
      'SMS Gateway needs SMS permissions to function. Please grant them in device Settings.',
    );
  }
}

export default function App() {
  const stopListeningRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    async function init() {
      try {
        // 1. Request SMS + notification permissions
        await requestPermissions();

        // 2. Initialize SQLite (synchronous)
        messageStore.initialize();

        // 3. Start foreground service (keeps app alive in background)
        if (NativeServiceManager) {
          await NativeServiceManager.startForegroundService();
        }

        // 4. Start listening for incoming SMS + delivery events
        stopListeningRef.current = startListening();

        // 5. Restore saved server + cloud settings
        const [cloudSettings, localSettings] = await Promise.all([
          settingsStore.loadCloud(),
          settingsStore.loadLocalServer(),
        ]);

        if (localSettings.enabled) {
          await startHttpServer(
            localSettings.port,
            localSettings.login ?? '',
            localSettings.password ?? '',
          ).catch(e => console.warn('[App] Local server failed to start:', e));
        }

        if (cloudSettings.enabled) {
          cloudClient.connect().catch(e =>
            console.warn('[App] Cloud connection failed:', e),
          );
        }
      } catch (e) {
        console.error('[App] Initialization error:', e);
      }
    }

    init();

    return () => {
      stopListeningRef.current?.();
      cloudClient.disconnect();
    };
  }, []);

  return (
    <SafeAreaProvider>
      <StatusBar barStyle="light-content" backgroundColor="#111827" translucent={false} />
      <AppNavigator />
    </SafeAreaProvider>
  );
}
