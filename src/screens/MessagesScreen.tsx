import React, {useState} from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  Modal, ScrollView, RefreshControl, Image,
} from 'react-native';
import {Colors, Typography, Spacing, Radius} from '../theme';
import {Message, MessageState, MessageRecipient} from '../types';
import {useMessages} from '../hooks/useMessages';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const STATE_CONFIG: Record<MessageState, {color: string; dim: string; label: string}> = {
  Pending:   {color: Colors.warning, dim: Colors.warningDim, label: 'Pending'},
  Processed: {color: Colors.info,    dim: Colors.infoDim,    label: 'Processed'},
  Sent:      {color: Colors.info,    dim: Colors.infoDim,    label: 'Sent'},
  Delivered: {color: Colors.success, dim: Colors.successDim, label: 'Delivered'},
  Failed:    {color: Colors.error,   dim: Colors.errorDim,   label: 'Failed'},
};

function timeAgo(iso: string): string {
  const d = (Date.now() - new Date(iso).getTime()) / 1000;
  if (d < 60) return 'just now';
  if (d < 3600) return `${Math.floor(d / 60)}m ago`;
  if (d < 86400) return `${Math.floor(d / 3600)}h ago`;
  return `${Math.floor(d / 86400)}d ago`;
}

// ─── State Badge ─────────────────────────────────────────────────────────────

function Badge({state}: {state: MessageState}) {
  const cfg = STATE_CONFIG[state] ?? {color: Colors.textMuted, dim: Colors.surfaceBorder, label: state};
  return (
    <View style={[styles.badge, {backgroundColor: cfg.dim}]}>
      <View style={[styles.badgeDot, {backgroundColor: cfg.color}]} />
      <Text style={[styles.badgeText, {color: cfg.color}]}>{cfg.label}</Text>
    </View>
  );
}

// ─── Message Row ─────────────────────────────────────────────────────────────

function MessageRow({msg, onPress}: {msg: Message; onPress: () => void}) {
  const phones = msg.phoneNumbers.slice(0, 2).join(', ') +
    (msg.phoneNumbers.length > 2 ? ` +${msg.phoneNumbers.length - 2}` : '');

  return (
    <TouchableOpacity style={styles.row} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.rowLeft}>
        <View style={[styles.sourceTag, {backgroundColor: Colors.gold + '18'}]}>
          <Text style={styles.sourceTagText}>
            {msg.source === 'cloud' ? 'CLOUD' : msg.source === 'http' ? 'API' : 'IN'}
          </Text>
        </View>
      </View>
      <View style={styles.rowCenter}>
        <View style={styles.rowHeader}>
          <Text style={styles.rowPhone} numberOfLines={1}>{phones}</Text>
          <Text style={styles.rowTime}>{timeAgo(msg.createdAt)}</Text>
        </View>
        <Text style={styles.rowBody} numberOfLines={1}>{msg.message}</Text>
        <View style={styles.rowFooter}>
          <Badge state={msg.state} />
          {msg.recipients.length > 1 && (
            <Text style={styles.rowCount}>{msg.recipients.length} recipients</Text>
          )}
          {msg.isEncrypted && (
            <Text style={styles.encTag}>🔒 encrypted</Text>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

// ─── Detail Modal ─────────────────────────────────────────────────────────────

function DetailModal({msg, onClose}: {msg: Message; onClose: () => void}) {
  return (
    <Modal visible animationType="slide" onRequestClose={onClose}>
      <View style={styles.modal}>
        {/* Header */}
        <View style={styles.modalHeader}>
          <View>
            <Text style={styles.modalTitle}>Message Details</Text>
            <Text style={styles.modalSub}>{timeAgo(msg.createdAt)}</Text>
          </View>
          <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
            <Text style={styles.closeBtnText}>✕</Text>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.modalBody} showsVerticalScrollIndicator={false}>
          {/* Status */}
          <View style={styles.detailStatusRow}>
            <Badge state={msg.state} />
            {msg.isEncrypted && (
              <View style={[styles.badge, {backgroundColor: Colors.goldDim}]}>
                <Text style={[styles.badgeText, {color: Colors.gold}]}>Encrypted</Text>
              </View>
            )}
            {msg.source && (
              <View style={[styles.badge, {backgroundColor: Colors.infoDim}]}>
                <Text style={[styles.badgeText, {color: Colors.info}]}>{msg.source.toUpperCase()}</Text>
              </View>
            )}
          </View>

          {/* ID */}
          <View style={styles.detailBlock}>
            <Text style={styles.detailLabel}>MESSAGE ID</Text>
            <Text style={styles.detailMono} selectable>{msg.id}</Text>
          </View>

          {/* Body */}
          <View style={styles.detailBlock}>
            <Text style={styles.detailLabel}>CONTENT</Text>
            <View style={styles.messageBox}>
              <Text style={styles.messageBoxText}>{msg.message}</Text>
            </View>
          </View>

          {/* Metadata */}
          <View style={styles.metaRow}>
            <View style={styles.metaItem}>
              <Text style={styles.detailLabel}>CREATED</Text>
              <Text style={styles.detailValue}>{new Date(msg.createdAt).toLocaleString()}</Text>
            </View>
            {msg.simNumber && (
              <View style={styles.metaItem}>
                <Text style={styles.detailLabel}>SIM</Text>
                <Text style={styles.detailValue}>SIM {msg.simNumber}</Text>
              </View>
            )}
          </View>

          {/* Recipients */}
          <Text style={styles.detailLabel}>RECIPIENTS</Text>
          <View style={styles.recipientsList}>
            {msg.recipients.map((r: MessageRecipient, i: number) => (
              <View key={i} style={styles.recipientCard}>
                <View style={styles.recipientTop}>
                  <Text style={styles.recipientPhone}>{r.phoneNumber}</Text>
                  <Badge state={r.state} />
                </View>
                {r.error && (
                  <View style={styles.errorRow}>
                    <Text style={styles.errorText}>{r.error}</Text>
                  </View>
                )}
                {r.sentAt && (
                  <Text style={styles.timeText}>
                    Sent: {new Date(r.sentAt).toLocaleTimeString()}
                    {r.deliveredAt ? `  ·  Delivered: ${new Date(r.deliveredAt).toLocaleTimeString()}` : ''}
                  </Text>
                )}
              </View>
            ))}
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function MessagesScreen() {
  const {messages, loading, refresh} = useMessages();
  const [selected, setSelected] = useState<Message | null>(null);

  return (
    <View style={styles.container}>
      {/* Screen Header */}
      <View style={styles.screenHeader}>
        <View style={styles.screenHeaderLogoWrap}>
          <Image source={require('../assets/logo.png')} style={styles.screenHeaderLogo} resizeMode="contain" />
        </View>
        <View>
          <Text style={styles.screenHeaderTitle}>Messages</Text>
          <Text style={styles.screenHeaderSub}>{messages.length} total</Text>
        </View>
      </View>

      <FlatList
        data={messages}
        keyExtractor={m => m.id}
        renderItem={({item}) => (
          <MessageRow msg={item} onPress={() => setSelected(item)} />
        )}
        contentContainerStyle={styles.list}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={refresh}
            tintColor={Colors.gold}
            colors={[Colors.gold]}
          />
        }
        ListEmptyComponent={
          !loading ? (
            <View style={styles.empty}>
              <Text style={styles.emptyIcon}>✉</Text>
              <Text style={styles.emptyTitle}>No Messages Yet</Text>
              <Text style={styles.emptySub}>
                Sent and received messages will appear here once the gateway is active.
              </Text>
            </View>
          ) : null
        }
      />
      {selected && (
        <DetailModal msg={selected} onClose={() => setSelected(null)} />
      )}
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: Colors.bg},
  list: {paddingHorizontal: Spacing.md, paddingTop: Spacing.xs, paddingBottom: Spacing.xl},

  // Screen header
  screenHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  screenHeaderLogoWrap: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: 'rgba(34,197,94,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(34,197,94,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  screenHeaderLogo: {width: 24, height: 24},
  screenHeaderTitle: {fontSize: Typography.base, fontWeight: Typography.bold, color: Colors.textPrimary},
  screenHeaderSub: {fontSize: Typography.xs, color: Colors.textMuted, marginTop: 1},

  row: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    overflow: 'hidden',
  },
  rowLeft: {
    width: 40,
    backgroundColor: Colors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
    borderRightWidth: 1,
    borderRightColor: Colors.surfaceBorder,
  },
  sourceTag: {borderRadius: 4, paddingHorizontal: 4, paddingVertical: 2},
  sourceTagText: {fontSize: 8, fontWeight: Typography.bold, color: Colors.gold, letterSpacing: 0.5},
  rowCenter: {flex: 1, padding: Spacing.sm + 4, gap: 4},
  rowHeader: {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'},
  rowPhone: {fontSize: Typography.sm, fontWeight: Typography.semibold, color: Colors.textPrimary, flex: 1},
  rowTime: {fontSize: Typography.xs, color: Colors.textMuted},
  rowBody: {fontSize: Typography.sm, color: Colors.textSecondary},
  rowFooter: {flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap'},
  rowCount: {fontSize: Typography.xs, color: Colors.textMuted},
  encTag: {fontSize: Typography.xs, color: Colors.textMuted},

  badge: {flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: Radius.sm, paddingHorizontal: 7, paddingVertical: 3},
  badgeDot: {width: 5, height: 5, borderRadius: 3},
  badgeText: {fontSize: Typography.xs, fontWeight: Typography.semibold},

  separator: {height: 6},

  empty: {flex: 1, alignItems: 'center', paddingTop: 80, paddingHorizontal: 40, gap: 10},
  emptyIcon: {fontSize: 48, color: Colors.textMuted},
  emptyTitle: {fontSize: Typography.lg, fontWeight: Typography.semibold, color: Colors.textSecondary},
  emptySub: {fontSize: Typography.sm, color: Colors.textMuted, textAlign: 'center', lineHeight: 20},

  // Modal
  modal: {flex: 1, backgroundColor: Colors.bg},
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.surfaceBorder,
    backgroundColor: Colors.surface,
  },
  modalTitle: {fontSize: Typography.lg, fontWeight: Typography.bold, color: Colors.textPrimary},
  modalSub: {fontSize: Typography.xs, color: Colors.textMuted, marginTop: 2},
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: Radius.full,
    backgroundColor: Colors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtnText: {fontSize: Typography.sm, color: Colors.textSecondary},
  modalBody: {padding: Spacing.md, gap: Spacing.md},

  detailStatusRow: {flexDirection: 'row', gap: 8, flexWrap: 'wrap'},

  detailBlock: {gap: 6},
  detailLabel: {
    fontSize: Typography.xs,
    fontWeight: Typography.semibold,
    color: Colors.textMuted,
    letterSpacing: 1.2,
    marginBottom: 2,
  },
  detailMono: {fontSize: Typography.xs, color: Colors.textSecondary, fontFamily: 'monospace'},
  detailValue: {fontSize: Typography.sm, color: Colors.textPrimary},

  messageBox: {
    backgroundColor: Colors.surfaceElevated,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    padding: Spacing.sm + 4,
  },
  messageBoxText: {fontSize: Typography.base, color: Colors.textPrimary, lineHeight: 22},

  metaRow: {flexDirection: 'row', gap: Spacing.md},
  metaItem: {flex: 1, gap: 4},

  recipientsList: {gap: 6},
  recipientCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    padding: Spacing.sm + 4,
    gap: 6,
  },
  recipientTop: {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'},
  recipientPhone: {fontSize: Typography.sm, fontWeight: Typography.semibold, color: Colors.textPrimary},
  errorRow: {backgroundColor: Colors.errorDim, borderRadius: 4, padding: 6},
  errorText: {fontSize: Typography.xs, color: Colors.error},
  timeText: {fontSize: Typography.xs, color: Colors.textMuted},
});
