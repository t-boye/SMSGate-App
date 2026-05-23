import React, {useState, useEffect} from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TextInput, Switch, TouchableOpacity,
  Alert, ActivityIndicator, Modal, KeyboardAvoidingView, Platform,
} from 'react-native';
import {Colors, Typography, Spacing, Radius} from '../theme';
import {Webhook} from '../types';
import {useSettings} from '../hooks/useSettings';
import {settingsStore} from '../modules/settings/SettingsStore';
import {Encryption} from '../modules/crypto/Encryption';

// ─── Primitives ───────────────────────────────────────────────────────────────

function Section({title, subtitle}: {title: string; subtitle?: string}) {
  return (
    <View style={styles.sectionHead}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {subtitle && <Text style={styles.sectionSub}>{subtitle}</Text>}
    </View>
  );
}

function SettingRow({
  label,
  hint,
  children,
  last,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
  last?: boolean;
}) {
  return (
    <View style={[styles.row, !last && styles.rowBorder]}>
      <View style={styles.rowLeft}>
        <Text style={styles.rowLabel}>{label}</Text>
        {hint && <Text style={styles.rowHint}>{hint}</Text>}
      </View>
      <View style={styles.rowRight}>{children}</View>
    </View>
  );
}

function Field({
  value,
  onChangeText,
  placeholder,
  secure,
  numeric,
  url,
  mono,
}: {
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  secure?: boolean;
  numeric?: boolean;
  url?: boolean;
  mono?: boolean;
}) {
  return (
    <TextInput
      style={[styles.input, mono && styles.inputMono]}
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor={Colors.textMuted}
      secureTextEntry={secure}
      keyboardType={numeric ? 'numeric' : url ? 'url' : 'default'}
      autoCapitalize="none"
      autoCorrect={false}
    />
  );
}

// ─── Webhook Card ─────────────────────────────────────────────────────────────

const EVENT_OPTIONS = ['sms:sent', 'sms:received', 'sms:delivered', 'sms:failed', '*'];

function WebhookCard({
  webhook,
  onChange,
  onRemove,
}: {
  webhook: Webhook;
  onChange: (w: Webhook) => void;
  onRemove: () => void;
}) {
  return (
    <View style={styles.webhookCard}>
      <View style={styles.webhookHeader}>
        <Text style={styles.webhookLabel}>WEBHOOK URL</Text>
        <TouchableOpacity style={styles.removeBtn} onPress={onRemove}>
          <Text style={styles.removeBtnText}>Remove</Text>
        </TouchableOpacity>
      </View>
      <TextInput
        style={styles.webhookUrl}
        value={webhook.url}
        onChangeText={url => onChange({...webhook, url})}
        placeholder="https://your-server.com/webhook"
        placeholderTextColor={Colors.textMuted}
        autoCapitalize="none"
        keyboardType="url"
      />
      <Text style={[styles.webhookLabel, {marginTop: 10}]}>TRIGGER EVENT</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
        {EVENT_OPTIONS.map(ev => (
          <TouchableOpacity
            key={ev}
            style={[styles.chip, webhook.event === ev && styles.chipActive]}
            onPress={() => onChange({...webhook, event: ev})}>
            <Text style={[styles.chipText, webhook.event === ev && styles.chipTextActive]}>
              {ev}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

// ─── Register Modal ───────────────────────────────────────────────────────────

function RegisterModal({
  serverUrl,
  onSuccess,
  onClose,
}: {
  serverUrl: string;
  onSuccess: (login: string, password: string) => void;
  onClose: () => void;
}) {
  const [name, setName]         = useState('');
  const [login, setLogin]       = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading]   = useState(false);

  const handleRegister = async () => {
    if (!name || !login || !password) {
      Alert.alert('Error', 'All fields are required.');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${serverUrl}/api/v1/auth/register`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({name, login, password}),
      });
      const data = await res.json() as any;
      if (!res.ok) throw new Error(data.error ?? 'Registration failed');
      Alert.alert('Account Created', `Welcome, ${data.name}! Your credentials have been saved.`);
      onSuccess(login, password);
    } catch (e: any) {
      Alert.alert('Registration Failed', e?.message ?? 'Could not connect to server.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={{flex: 1}}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <View style={styles.modalOverlay}>
        <View style={styles.registerModal}>
          <Text style={styles.registerTitle}>Create Account</Text>
          <Text style={styles.registerSub}>Register this device on the relay server</Text>

          <View style={styles.registerFields}>
            <TextInput style={styles.registerInput} value={name} onChangeText={setName}
              placeholder="Display name" placeholderTextColor={Colors.textMuted}
              autoCapitalize="words" />
            <TextInput style={styles.registerInput} value={login} onChangeText={setLogin}
              placeholder="Username" placeholderTextColor={Colors.textMuted}
              autoCapitalize="none" autoCorrect={false} />
            <TextInput style={styles.registerInput} value={password} onChangeText={setPassword}
              placeholder="Password (min 6 chars)" placeholderTextColor={Colors.textMuted}
              secureTextEntry autoCapitalize="none" />
          </View>

          <TouchableOpacity
            style={[styles.registerBtn, loading && styles.saveBtnDisabled]}
            onPress={handleRegister}
            disabled={loading}>
            {loading
              ? <ActivityIndicator color={Colors.textInverse} size="small" />
              : <Text style={styles.saveBtnText}>Create Account</Text>}
          </TouchableOpacity>

          <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
            <Text style={styles.cancelBtnText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function SettingsScreen() {
  const {
    cloud, setCloud,
    localServer, setLocalServer,
    messages, setMessages,
    webhooks, setWebhooks,
    serverUrl,
    loaded, save,
  } = useSettings();

  const [saving, setSaving]             = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const [encKey, setEncKey]             = useState<string | null>(null);
  const [encKeySaving, setEncKeySaving] = useState(false);

  useEffect(() => {
    settingsStore.loadEncryptionKey().then(setEncKey);
  }, []);

  const handleGenerateKey = async () => {
    const newKey = Encryption.generateKey();
    setEncKeySaving(true);
    try {
      await settingsStore.saveEncryptionKey(newKey);
      setEncKey(newKey);
      Alert.alert('Key Generated', 'A new encryption key has been saved. Keep it safe — messages encrypted with the old key cannot be read.');
    } finally {
      setEncKeySaving(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await save();
      Alert.alert('Settings Saved', 'All changes have been applied.');
    } catch (e: any) {
      Alert.alert('Error', e?.message ?? 'Failed to save settings.');
    } finally {
      setSaving(false);
    }
  };

  if (!loaded) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={Colors.gold} />
        <Text style={styles.loadingText}>Loading settings…</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}>

      {/* ── Cloud Server ── */}
      <Section
        title="Cloud Server"
        subtitle="Connect to a remote relay to receive SMS jobs from anywhere"
      />
      <View style={styles.card}>
        <SettingRow label="Enable Cloud Mode">
          <Switch
            value={cloud.enabled}
            onValueChange={v => setCloud(p => ({...p, enabled: v}))}
            trackColor={{false: Colors.surfaceBorder, true: Colors.gold + '55'}}
            thumbColor={cloud.enabled ? Colors.gold : Colors.textMuted}
          />
        </SettingRow>
        {cloud.enabled && <>
          <SettingRow label="Server URL" hint="Your SMS gateway relay endpoint">
            <Field value={cloud.url ?? ''} onChangeText={v => setCloud(p => ({...p, url: v}))}
              placeholder="https://sms-gate-app.vercel.app" url />
          </SettingRow>
          <SettingRow label="Login">
            <Field value={cloud.login ?? ''} onChangeText={v => setCloud(p => ({...p, login: v}))}
              placeholder="Username" />
          </SettingRow>
          <SettingRow label="Password" last>
            <Field value={cloud.password ?? ''} onChangeText={v => setCloud(p => ({...p, password: v}))}
              placeholder="••••••••" secure />
          </SettingRow>
          {cloud.url ? (
            <TouchableOpacity
              style={styles.registerTrigger}
              onPress={() => setShowRegister(true)}>
              <Text style={styles.registerTriggerText}>No account yet? Create one</Text>
            </TouchableOpacity>
          ) : null}
        </>}
        {!cloud.enabled && <View style={styles.rowSpacer} />}
      </View>

      {showRegister && cloud.url ? (
        <RegisterModal
          serverUrl={cloud.url}
          onSuccess={(login, password) => {
            setCloud(p => ({...p, login, password}));
            setShowRegister(false);
          }}
          onClose={() => setShowRegister(false)}
        />
      ) : null}

      {/* ── Local HTTP Server ── */}
      <Section
        title="Local HTTP Server"
        subtitle="Expose a REST API on your local Wi-Fi network"
      />
      <View style={styles.card}>
        <SettingRow label="Enable Local Server">
          <Switch
            value={localServer.enabled}
            onValueChange={v => setLocalServer(p => ({...p, enabled: v}))}
            trackColor={{false: Colors.surfaceBorder, true: Colors.gold + '55'}}
            thumbColor={localServer.enabled ? Colors.gold : Colors.textMuted}
          />
        </SettingRow>
        {localServer.enabled && <>
          <SettingRow label="Port">
            <Field value={String(localServer.port)}
              onChangeText={v => setLocalServer(p => ({...p, port: Number(v) || 8080}))}
              placeholder="8080" numeric />
          </SettingRow>
          <SettingRow label="Basic Auth Login" hint="Optional">
            <Field value={localServer.login ?? ''} onChangeText={v => setLocalServer(p => ({...p, login: v}))}
              placeholder="Leave blank to disable" />
          </SettingRow>
          <SettingRow label="Basic Auth Password" last>
            <Field value={localServer.password ?? ''} onChangeText={v => setLocalServer(p => ({...p, password: v}))}
              placeholder="••••••••" secure />
          </SettingRow>
          {serverUrl && (
            <View style={styles.urlBox}>
              <Text style={styles.urlLabel}>ACTIVE API URL</Text>
              <Text style={styles.urlValue} selectable>{serverUrl}</Text>
            </View>
          )}
        </>}
        {!localServer.enabled && <View style={styles.rowSpacer} />}
      </View>

      {/* ── Messages ── */}
      <Section
        title="Messages"
        subtitle="Default behaviour for outgoing messages"
      />
      <View style={styles.card}>
        <SettingRow
          label="Track Delivery"
          hint="Request delivery receipts from the carrier">
          <Switch
            value={messages.trackDelivery}
            onValueChange={v => setMessages(p => ({...p, trackDelivery: v}))}
            trackColor={{false: Colors.surfaceBorder, true: Colors.gold + '55'}}
            thumbColor={messages.trackDelivery ? Colors.gold : Colors.textMuted}
          />
        </SettingRow>
        <SettingRow label="Default SIM" hint="1 = first SIM slot">
          <Field value={String(messages.simNumber ?? 1)}
            onChangeText={v => setMessages(p => ({...p, simNumber: Number(v) || 1}))}
            placeholder="1" numeric />
        </SettingRow>
        <SettingRow label="Message TTL" hint="Seconds before a pending message expires" last>
          <Field value={String(messages.validUntil ?? 86400)}
            onChangeText={v => setMessages(p => ({...p, validUntil: Number(v) || 86400}))}
            placeholder="86400" numeric />
        </SettingRow>
      </View>

      {/* ── Encryption ── */}
      <Section
        title="Encryption"
        subtitle="AES-256 end-to-end encryption for outgoing messages"
      />
      <View style={styles.card}>
        <SettingRow label="Encryption Key" hint="Generated locally, never leaves your device" last>
          <TouchableOpacity
            style={[styles.keyBtn, encKeySaving && styles.saveBtnDisabled]}
            onPress={handleGenerateKey}
            disabled={encKeySaving}>
            {encKeySaving
              ? <ActivityIndicator size="small" color={Colors.gold} />
              : <Text style={styles.keyBtnText}>{encKey ? 'Regenerate' : 'Generate Key'}</Text>}
          </TouchableOpacity>
        </SettingRow>
        {encKey ? (
          <View style={styles.urlBox}>
            <Text style={styles.urlLabel}>ACTIVE KEY</Text>
            <Text style={styles.urlValue} selectable numberOfLines={1}>{encKey}</Text>
          </View>
        ) : null}
      </View>

      {/* ── Webhooks ── */}
      <Section
        title="Webhooks"
        subtitle="HTTP POST notifications for SMS events"
      />
      <View style={styles.webhookList}>
        {webhooks.map(w => (
          <WebhookCard
            key={w.id}
            webhook={w}
            onChange={updated => setWebhooks(prev => prev.map(x => (x.id === w.id ? updated : x)))}
            onRemove={() => setWebhooks(prev => prev.filter(x => x.id !== w.id))}
          />
        ))}
        <TouchableOpacity
          style={styles.addWebhookBtn}
          onPress={() => setWebhooks(prev => [
            ...prev,
            {id: `wh_${Date.now()}`, url: '', event: 'sms:sent'},
          ])}>
          <Text style={styles.addWebhookBtnText}>+ Add Webhook</Text>
        </TouchableOpacity>
      </View>

      {/* ── Save ── */}
      <TouchableOpacity
        style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
        onPress={handleSave}
        disabled={saving}>
        {saving
          ? <ActivityIndicator color={Colors.textInverse} size="small" />
          : <Text style={styles.saveBtnText}>Save Settings</Text>}
      </TouchableOpacity>

    </ScrollView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: Colors.bg},
  content: {padding: Spacing.md, paddingBottom: 40, gap: Spacing.sm},
  loading: {flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12, backgroundColor: Colors.bg},
  loadingText: {fontSize: Typography.sm, color: Colors.textMuted},

  sectionHead: {paddingTop: Spacing.sm, gap: 2},
  sectionTitle: {fontSize: Typography.sm, fontWeight: Typography.semibold, color: Colors.textSecondary, letterSpacing: 0.3},
  sectionSub: {fontSize: Typography.xs, color: Colors.textMuted},

  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    overflow: 'hidden',
  },
  row: {flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.md, paddingVertical: 14, minHeight: 54, gap: 8},
  rowBorder: {borderBottomWidth: 1, borderBottomColor: Colors.surfaceBorder},
  rowLeft: {flex: 1, gap: 2, flexShrink: 1},
  rowRight: {flexShrink: 0, alignItems: 'flex-end', maxWidth: '55%'},
  rowLabel: {fontSize: Typography.sm, color: Colors.textPrimary, fontWeight: Typography.medium},
  rowHint: {fontSize: Typography.xs, color: Colors.textMuted},
  rowSpacer: {height: 4},

  input: {
    fontSize: Typography.sm,
    color: Colors.textPrimary,
    textAlign: 'right',
    flex: 1,
    paddingVertical: 0,
  },
  inputMono: {fontFamily: 'monospace', fontSize: Typography.xs},

  urlBox: {
    backgroundColor: Colors.surfaceElevated,
    margin: Spacing.sm,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: Colors.gold + '33',
    padding: Spacing.sm + 4,
  },
  urlLabel: {fontSize: Typography.xs, fontWeight: Typography.semibold, color: Colors.textMuted, letterSpacing: 1, marginBottom: 4},
  urlValue: {fontSize: Typography.xs, color: Colors.gold, fontFamily: 'monospace'},

  webhookList: {gap: Spacing.sm},
  webhookCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    padding: Spacing.md,
    gap: 6,
  },
  webhookHeader: {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2},
  webhookLabel: {fontSize: Typography.xs, fontWeight: Typography.semibold, color: Colors.textMuted, letterSpacing: 1},
  webhookUrl: {
    fontSize: Typography.sm,
    color: Colors.textPrimary,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    borderRadius: Radius.sm,
    backgroundColor: Colors.surfaceElevated,
    padding: Spacing.sm + 2,
  },
  chipScroll: {marginTop: 2},
  chip: {
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    borderRadius: Radius.full,
    paddingHorizontal: 12,
    paddingVertical: 5,
    marginRight: 6,
    backgroundColor: Colors.surfaceElevated,
  },
  chipActive: {borderColor: Colors.gold, backgroundColor: Colors.goldDim},
  chipText: {fontSize: Typography.xs, color: Colors.textMuted, fontWeight: Typography.medium},
  chipTextActive: {color: Colors.gold},
  removeBtn: {paddingVertical: 3, paddingHorizontal: 8},
  removeBtnText: {fontSize: Typography.xs, color: Colors.error, fontWeight: Typography.medium},

  addWebhookBtn: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    borderStyle: 'dashed',
    padding: Spacing.md,
    alignItems: 'center',
  },
  addWebhookBtnText: {fontSize: Typography.sm, color: Colors.gold, fontWeight: Typography.semibold},

  saveBtn: {
    backgroundColor: Colors.gold,
    borderRadius: Radius.lg,
    padding: 16,
    alignItems: 'center',
    marginTop: Spacing.sm,
  },
  saveBtnDisabled: {opacity: 0.6},
  saveBtnText: {color: Colors.textInverse, fontWeight: Typography.bold, fontSize: Typography.base, letterSpacing: 0.3},

  // Key button
  keyBtn: {
    borderWidth: 1,
    borderColor: Colors.gold,
    borderRadius: Radius.sm,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  keyBtnText: {fontSize: Typography.xs, color: Colors.gold, fontWeight: Typography.semibold},

  // Register trigger
  registerTrigger: {padding: Spacing.md, alignItems: 'center'},
  registerTriggerText: {fontSize: Typography.sm, color: Colors.gold, fontWeight: Typography.medium},

  // Register modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    padding: Spacing.md,
  },
  registerModal: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  registerTitle: {fontSize: Typography.lg, fontWeight: Typography.bold, color: Colors.textPrimary},
  registerSub: {fontSize: Typography.sm, color: Colors.textMuted, marginBottom: Spacing.xs},
  registerFields: {gap: Spacing.sm},
  registerInput: {
    backgroundColor: Colors.surfaceElevated,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    borderRadius: Radius.sm,
    padding: Spacing.sm + 2,
    fontSize: Typography.sm,
    color: Colors.textPrimary,
  },
  registerBtn: {
    backgroundColor: Colors.gold,
    borderRadius: Radius.lg,
    padding: 14,
    alignItems: 'center',
    marginTop: Spacing.xs,
  },
  cancelBtn: {padding: 10, alignItems: 'center'},
  cancelBtnText: {fontSize: Typography.sm, color: Colors.textMuted},
});
