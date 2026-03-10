import {useCallback, useEffect, useState} from 'react';
import {NativeEventEmitter, NativeModules} from 'react-native';
import {Message} from '../types';
import {messageStore} from '../modules/storage/MessageStore';

const {SmsReceiver: NativeSmsReceiver} = NativeModules;

export function useMessages() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(() => {
    try {
      const msgs = messageStore.listMessages(100, 0);
      setMessages(msgs);
    } catch (e) {
      console.error('[useMessages] Failed to load messages:', e);
    } finally {
      setLoading(false);
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

  return {messages, loading, refresh};
}
