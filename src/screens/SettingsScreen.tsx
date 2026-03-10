import React, {useState} from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TextInput, Switch, TouchableOpacity,
  Alert, ActivityIndicator,
} from 'react-native';
import {Colors, Typography, Spacing, Radius} from '../theme';
import {Webhook} from '../types';
import {useSettings} from '../hooks/useSettings';

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

export default function SettingsScreen() {
  const {
    cloud, setCloud,
    localServer, setLocalServer,
    messages, setMessages,
    webhooks, setWebhooks,
    serverUrl,
    loaded, save,
  } = useSettings();

  const [saving, setSaving] = useState(false);

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
          <SettingRow label="Server URL" hint="Your SMS gateway cloud endpoint">
            <Field value={cloud.url ?? ''} onChangeText={v => setCloud(p => ({...p, url: v}))}
              placeholder="https://api.yourdomain.com" url />
          </SettingRow>
          <SettingRow label="Login">
            <Field value={cloud.login ?? ''} onChangeText={v => setCloud(p => ({...p, login: v}))}
              placeholder="Username" />
          </SettingRow>
          <SettingRow label="Password" last>
            <Field value={cloud.password ?? ''} onChangeText={v => setCloud(p => ({...p, password: v}))}
              placeholder="••••••••" secure />
          </SettingRow>
        </>}
        {!cloud.enabled && <View style={styles.rowSpacer} />}
      </View>

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
  row: {flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.md, paddingVertical: 14, minHeight: 54},
  rowBorder: {borderBottomWidth: 1, borderBottomColor: Colors.surfaceBorder},
  rowLeft: {flex: 1, gap: 2},
  rowRight: {flex: 1, alignItems: 'flex-end'},
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
});
