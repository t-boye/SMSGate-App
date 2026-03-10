import {useCallback, useEffect, useState} from 'react';
import {NativeEventEmitter, NativeModules} from 'react-native';
import {MessagesStats} from '../types';
import {messageStore} from '../modules/storage/MessageStore';

const {SmsReceiver: NativeSmsReceiver} = NativeModules;

const DEFAULT_STATS: MessagesStats = {
  pending: 0, processed: 0, sent: 0, delivered: 0, failed: 0,
};

export function useStats() {
  const [stats, setStats] = useState<MessagesStats>(DEFAULT_STATS);

  const refresh = useCallback(() => {
    try {
      const s = messageStore.getStats();
      setStats(s);
    } catch (e) {
      console.error('[useStats] Failed to load stats:', e);
    }
  }, []);

  useEffect(() => {
    refresh();

    if (!NativeSmsReceiver) return;

    const emitter = new NativeEventEmitter(NativeSmsReceiver);
    const sub1 = emitter.addListener('onDeliveryUpdate', refresh);
    const sub2 = emitter.addListener('onSmsReceived', refresh);
    return () => {
      sub1.remove();
      sub2.remove();
    };
  }, [refresh]);

  return {stats, refresh};
}
