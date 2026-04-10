import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors, statusColor } from '../theme/tacticalDark';
import type { AuditEntry } from '../types';

interface Props {
  entry: AuditEntry;
}

export function AuditLogItem({ entry }: Props) {
  const [expanded, setExpanded] = useState(false);
  const time = new Date(entry.timestamp).toLocaleTimeString('en-US', { hour12: false });
  const hashPreview = entry.hash.slice(0, 12) + '...';

  const eventColor = entry.eventType.includes('HALT') ? colors.criticalAction
    : entry.eventType.includes('REVOKE') ? colors.warningDrift
    : entry.eventType.includes('DRIFT') ? colors.warningDrift
    : colors.textSecondary;

  return (
    <TouchableOpacity onPress={() => setExpanded(!expanded)} activeOpacity={0.7}>
      <View style={styles.container}>
        <View style={styles.row}>
          <Text style={styles.time}>{time}</Text>
          <Text style={[styles.event, { color: eventColor }]}>{entry.eventType}</Text>
          <Text style={styles.lane}>{entry.targetLane}</Text>
        </View>
        <Text style={styles.hash}>sha: {hashPreview}</Text>

        {expanded && (
          <View style={styles.detail}>
            <Text style={styles.detailLabel}>TRACE</Text>
            <Text style={styles.detailValue}>{entry.traceId}</Text>
            <Text style={styles.detailLabel}>HASH</Text>
            <Text style={styles.detailValue}>{entry.hash}</Text>
            <Text style={styles.detailLabel}>PREV</Text>
            <Text style={styles.detailValue}>{entry.prevHash}</Text>
            <Text style={styles.detailLabel}>SEQ</Text>
            <Text style={styles.detailValue}>{String(entry.seq)}</Text>
            <Text style={styles.detailLabel}>PAYLOAD</Text>
            <Text style={styles.detailValue}>{entry.payloadJson}</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.cardBg,
    borderRadius: 8,
    padding: 12,
    marginVertical: 4,
    borderLeftWidth: 3,
    borderLeftColor: colors.textSecondary,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  time: { color: colors.textSecondary, fontSize: 12, fontFamily: 'monospace' },
  event: { fontSize: 12, fontWeight: '700' },
  lane: { color: colors.textSecondary, fontSize: 12 },
  hash: { color: colors.textSecondary, fontSize: 10, fontFamily: 'monospace', marginTop: 4 },
  detail: { marginTop: 10, borderTopWidth: 1, borderTopColor: '#333', paddingTop: 8 },
  detailLabel: { color: colors.textSecondary, fontSize: 10, fontWeight: '700', marginTop: 6, letterSpacing: 1 },
  detailValue: { color: colors.textPrimary, fontSize: 11, fontFamily: 'monospace' },
});
