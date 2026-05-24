import React, {useState} from 'react';
import {
  View, Text, Image, StyleSheet, ScrollView,
  Switch, ActivityIndicator, Alert, TouchableOpacity, Dimensions,
} from 'react-native';
import {Colors, Typography, Spacing, Radius} from '../theme';

const {width: SCREEN_W} = Dimensions.get('window');
const STAT_CARD_W = (SCREEN_W - Spacing.md * 2 - 8) / 2;
import {useStats} from '../hooks/useStats';
import {useSettings} from '../hooks/useSettings';

// ─── Stat Card ───────────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  color,
  dim,
}: {
  label: string;
  value: number;
  color: string;
  dim: string;
}) {
  return (
    <View style={[styles.statCard, {backgroundColor: dim}]}>
      <Text style={[styles.statValue, {color}]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

// ─── Connection Card ──────────────────────────────────────────────────────────

function ConnectionCard({
  title,
  subtitle,
  enabled,
  onToggle,
  saving,
  children,
}: {
  title: string;
  subtitle: string;
  enabled: boolean;
  onToggle: (v: boolean) => void;
  saving: boolean;
  children?: React.ReactNode;
}) {
  return (
    <View style={[styles.card, enabled && styles.cardActive]}>
      <View style={styles.cardRow}>
        <View style={styles.flex}>
          <View style={styles.titleRow}>
            <View style={[styles.statusDot, {backgroundColor: enabled ? Colors.success : Colors.textMuted}]} />
            <Text style={styles.cardTitle}>{title}</Text>
          </View>
          <Text style={styles.cardSub}>{subtitle}</Text>
        </View>
        {saving ? (
          <ActivityIndicator size="small" color={Colors.gold} />
        ) : (
          <Switch
            value={enabled}
            onValueChange={onToggle}
            trackColor={{false: Colors.surfaceBorder, true: Colors.gold + '55'}}
            thumbColor={enabled ? Colors.gold : Colors.textMuted}
            ios_backgroundColor={Colors.surfaceBorder}
          />
        )}
      </View>
      {children}
    </View>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function HomeScreen() {
  const {stats} = useStats();
  const {cloud, setCloud, localServer, setLocalServer, serverUrl, save} = useSettings();
  const [saving, setSaving] = useState(false);

  const applyToggle = async (apply: () => void, revert: () => void) => {
    apply();
    setSaving(true);
    try {
      await save();
    } catch (e: any) {
      revert();
      Alert.alert('Error', e?.message ?? 'Failed to apply');
    } finally {
      setSaving(false);
    }
  };

  const total = stats.pending + stats.sent + stats.delivered + stats.failed;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}>

      {/* ── Header Banner ── */}
      <View style={styles.banner}>
        <View style={styles.bannerLeft}>
          <Image
            source={require('../assets/logo.png')}
            style={styles.bannerLogo}
            resizeMode="contain"
          />
          <Text style={styles.bannerLabel}>TOTAL MESSAGES</Text>
          <Text style={styles.bannerValue}>{total}</Text>
        </View>
        <View style={styles.bannerDivider} />
        <View style={styles.bannerRight}>
          <View style={styles.bannerStatusRow}>
            <View style={[styles.statusDot, {backgroundColor: cloud.enabled || localServer.enabled ? Colors.success : Colors.textMuted}]} />
            <Text style={styles.bannerStatus}>
              {cloud.enabled ? 'Cloud Active' : localServer.enabled ? 'Local Active' : 'Standby'}
            </Text>
          </View>
          <Text style={styles.bannerStatusSub}>Gateway Status</Text>
        </View>
      </View>

      {/* ── Stats ── */}
      <Text style={styles.sectionLabel}>STATISTICS</Text>
      <View style={styles.statsGrid}>
        <StatCard label="Pending"   value={stats.pending}   color={Colors.warning} dim={Colors.warningDim} />
        <StatCard label="Sent"      value={stats.sent}      color={Colors.info}    dim={Colors.infoDim} />
        <StatCard label="Delivered" value={stats.delivered} color={Colors.success} dim={Colors.successDim} />
        <StatCard label="Failed"    value={stats.failed}    color={Colors.error}   dim={Colors.errorDim} />
      </View>

      {/* ── Connections ── */}
      <Text style={styles.sectionLabel}>CONNECTION MODE</Text>

      <ConnectionCard
        title="Cloud Server"
        subtitle="Receive jobs via encrypted cloud relay"
        enabled={cloud.enabled}
        saving={saving}
        onToggle={v => applyToggle(
          () => setCloud(p => ({...p, enabled: v})),
          () => setCloud(p => ({...p, enabled: !v})),
        )}>
        {cloud.enabled && (
          <View style={styles.cardDetail}>
            <Text style={styles.cardDetailLabel}>ENDPOINT</Text>
            <Text style={styles.cardDetailValue} selectable numberOfLines={1}>
              {cloud.url ?? 'Not configured'}
            </Text>
          </View>
        )}
      </ConnectionCard>

      <ConnectionCard
        title="Local HTTP Server"
        subtitle="REST API accessible on your Wi-Fi network"
        enabled={localServer.enabled}
        saving={saving}
        onToggle={v => applyToggle(
          () => setLocalServer(p => ({...p, enabled: v})),
          () => setLocalServer(p => ({...p, enabled: !v})),
        )}>
        {localServer.enabled && serverUrl && (
          <View style={styles.cardDetail}>
            <Text style={styles.cardDetailLabel}>API URL</Text>
            <Text style={styles.cardDetailValue} selectable>{serverUrl}</Text>
          </View>
        )}
      </ConnectionCard>

      {/* ── Quick API Reference ── */}
      {localServer.enabled && serverUrl && (
        <>
          <Text style={styles.sectionLabel}>API REFERENCE</Text>
          <View style={styles.apiCard}>
            {[
              {method: 'POST', path: '/message', desc: 'Send SMS'},
              {method: 'GET',  path: '/message/:id', desc: 'Message status'},
              {method: 'GET',  path: '/messages', desc: 'List messages'},
              {method: 'GET',  path: '/health', desc: 'Health check'},
            ].map((ep, i, arr) => (
              <View key={ep.path} style={[styles.apiRow, i < arr.length - 1 && styles.apiRowBorder]}>
                <View style={[styles.methodBadge, ep.method === 'POST' && styles.methodPost]}>
                  <Text style={styles.methodText}>{ep.method}</Text>
                </View>
                <Text style={styles.apiPath}>{ep.path}</Text>
                <Text style={styles.apiDesc}>{ep.desc}</Text>
              </View>
            ))}
          </View>
        </>
      )}

    </ScrollView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: Colors.bg},
  content: {padding: Spacing.md, paddingBottom: Spacing.xl, gap: Spacing.sm},

  // Banner
  banner: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    padding: Spacing.md,
    marginBottom: Spacing.xs,
    alignItems: 'center',
  },
  bannerLeft: {flex: 1},
  bannerLogo: {height: 44, width: 110, marginBottom: 6},
  bannerLabel: {fontSize: Typography.xs, fontWeight: Typography.semibold, color: Colors.textMuted, letterSpacing: 1.2},
  bannerValue: {fontSize: Typography['3xl'], fontWeight: Typography.bold, color: Colors.gold, marginTop: 2},
  bannerDivider: {width: 1, height: 40, backgroundColor: Colors.surfaceBorder, marginHorizontal: Spacing.md},
  bannerRight: {flex: 1, alignItems: 'flex-end'},
  bannerStatusRow: {flexDirection: 'row', alignItems: 'center', gap: 6},
  bannerStatus: {fontSize: Typography.sm, fontWeight: Typography.semibold, color: Colors.textPrimary},
  bannerStatusSub: {fontSize: Typography.xs, color: Colors.textMuted, marginTop: 2},

  // Section
  sectionLabel: {
    fontSize: Typography.xs,
    fontWeight: Typography.semibold,
    color: Colors.textMuted,
    letterSpacing: 1.5,
    marginTop: Spacing.xs,
    marginBottom: 2,
  },

  // Stats
  statsGrid: {flexDirection: 'row', flexWrap: 'wrap', gap: 8},
  statCard: {
    width: STAT_CARD_W,
    borderRadius: Radius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
  },
  statValue: {fontSize: Typography['2xl'], fontWeight: Typography.bold},
  statLabel: {fontSize: Typography.xs, color: Colors.textSecondary, marginTop: 2, fontWeight: Typography.medium},

  // Connection Card
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  cardActive: {borderColor: Colors.gold + '44'},
  cardRow: {flexDirection: 'row', alignItems: 'center'},
  flex: {flex: 1},
  titleRow: {flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 3},
  statusDot: {width: 7, height: 7, borderRadius: 4},
  cardTitle: {fontSize: Typography.base, fontWeight: Typography.semibold, color: Colors.textPrimary},
  cardSub: {fontSize: Typography.sm, color: Colors.textSecondary},
  cardDetail: {
    backgroundColor: Colors.surfaceElevated,
    borderRadius: Radius.sm,
    padding: Spacing.sm + 4,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
  },
  cardDetailLabel: {fontSize: Typography.xs, fontWeight: Typography.semibold, color: Colors.textMuted, letterSpacing: 1, marginBottom: 3},
  cardDetailValue: {fontSize: Typography.sm, color: Colors.gold, fontFamily: 'monospace'},

  // API Reference
  apiCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    overflow: 'hidden',
  },
  apiRow: {flexDirection: 'row', alignItems: 'center', padding: Spacing.sm + 4, gap: 10},
  apiRowBorder: {borderBottomWidth: 1, borderBottomColor: Colors.surfaceBorder},
  methodBadge: {
    backgroundColor: Colors.infoDim,
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    minWidth: 42,
    alignItems: 'center',
  },
  methodPost: {backgroundColor: Colors.successDim},
  methodText: {fontSize: Typography.xs, fontWeight: Typography.bold, color: Colors.textSecondary, letterSpacing: 0.5},
  apiPath: {flex: 1, fontSize: Typography.xs, color: Colors.gold, fontFamily: 'monospace'},
  apiDesc: {fontSize: Typography.xs, color: Colors.textMuted},
});
