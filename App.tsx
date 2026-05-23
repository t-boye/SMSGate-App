import React, {useEffect, useRef, Component} from 'react';
import {StatusBar, NativeModules, Alert, Platform, View, Text, ScrollView, StyleSheet} from 'react-native';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import AppNavigator from './src/navigation/AppNavigator';
import {messageStore} from './src/modules/storage/MessageStore';
import {settingsStore} from './src/modules/settings/SettingsStore';
import {startListening} from './src/modules/sms/SmsReceiver';
import {cloudClient} from './src/modules/cloud/CloudClient';
import {startHttpServer} from './src/modules/server/HttpServer';

const {ServiceManager: NativeServiceManager} = NativeModules;

class ErrorBoundary extends Component<
  {children: React.ReactNode},
  {error: string | null}
> {
  state = {error: null};
  static getDerivedStateFromError(e: any) {
    return {error: String(e?.message ?? e)};
  }
  render() {
    if (this.state.error) {
      return (
        <View style={eb.container}>
          <Text style={eb.title}>Startup Error</Text>
          <ScrollView>
            <Text style={eb.msg} selectable>{this.state.error}</Text>
          </ScrollView>
        </View>
      );
    }
    return this.props.children;
  }
}

const eb = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#0A0E1A', padding: 24, justifyContent: 'center'},
  title: {color: '#EF4444', fontSize: 18, fontWeight: '700', marginBottom: 16},
  msg: {color: '#F1F5F9', fontSize: 13, fontFamily: 'monospace', lineHeight: 20},
});

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

function AppInner() {
  const stopListeningRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    async function init() {
      try {
        await requestPermissions();
        messageStore.initialize();

        if (NativeServiceManager) {
          await NativeServiceManager.startForegroundService();
        }

        stopListeningRef.current = startListening();

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
      } catch (e: any) {
        Alert.alert('Startup Error', String(e?.message ?? e));
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

export default function App() {
  return (
    <ErrorBoundary>
      <AppInner />
    </ErrorBoundary>
  );
}
