import React from 'react';
import { View, Text, StyleSheet, ScrollView, FlatList } from 'react-native';
import { colors } from '../theme/tacticalDark';
import { LaneCard } from '../components/LaneCard';
import { useConstellationStore } from '../store/constellationStore';
import type { AuditEntry } from '../types';

interface Props {
  recentAudit: AuditEntry[];
}

export function DashboardScreen({ recentAudit }: Props) {
  const { lanes, selectedLaneId, selectLane, halted, globalPsi } = useConstellationStore();

  const activeLanes = lanes.filter(l => l.status !== 'HALTED').length;
  const haltedLanes = lanes.filter(l => l.status === 'HALTED').length;
  const fatiguedLanes = lanes.filter(l => l.status === 'FATIGUED' || l.status === 'DEPLETED').length;

  return (
    <View style={styles.container}>
      {/* Lane Selector — Horizontal Scroll */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.laneRow}
      >
        {lanes.map(lane => (
          <LaneCard
            key={lane.id}
            lane={lane}
            isSelected={selectedLaneId === lane.id}
            onSelect={() => selectLane(selectedLaneId === lane.id ? null : lane.id)}
          />
        ))}
      </ScrollView>

      {/* Quick Stats */}
      <View style={styles.statsRow}>
        <StatBox label="LANES" value={String(lanes.length)} color={colors.textPrimary} />
        <StatBox label="ACTIVE" value={String(activeLanes)} color={colors.successStable} />
        <StatBox label="HALTED" value={String(haltedLanes)} color={colors.criticalAction} />
        <StatBox label="FATIGUED" value={String(fatiguedLanes)} color={colors.warningDrift} />
      </View>

      {halted && (
        <View style={styles.haltBanner}>
          <Text style={styles.haltText}>⛔ GLOBAL HALT ACTIVE</Text>
        </View>
      )}

      {/* Recent Governance Events */}
      <Text style={styles.sectionTitle}>RECENT EVENTS</Text>
      {recentAudit.length === 0 ? (
        <Text style={styles.empty}>No governance events yet.</Text>
      ) : (
        <FlatList
          data={recentAudit.slice(0, 10)}
          keyExtractor={(item) => String(item.seq)}
          renderItem={({ item }) => (
            <View style={styles.eventRow}>
              <Text style={styles.eventTime}>
                {new Date(item.timestamp).toLocaleTimeString('en-US', { hour12: false })}
              </Text>
              <Text style={[styles.eventType, {
                color: item.eventType.includes('HALT') ? colors.criticalAction : colors.textSecondary
              }]}>
                {item.eventType}
              </Text>
              <Text style={styles.eventLane}>{item.targetLane}</Text>
            </View>
          )}
        />
      )}
    </View>
  );
}

function StatBox({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <View style={styles.statBox}>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  laneRow: { paddingHorizontal: 8, paddingVertical: 10 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-around', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#222' },
  statBox: { alignItems: 'center' },
  statValue: { fontSize: 22, fontWeight: '800', fontFamily: 'monospace' },
  statLabel: { color: colors.textSecondary, fontSize: 10, fontWeight: '600', letterSpacing: 1, marginTop: 2 },
  haltBanner: { backgroundColor: colors.criticalAction + '22', paddingVertical: 8, alignItems: 'center' },
  haltText: { color: colors.criticalAction, fontWeight: '800', fontSize: 14 },
  sectionTitle: { color: colors.textSecondary, fontSize: 11, fontWeight: '700', letterSpacing: 2, paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8 },
  empty: { color: colors.textSecondary, fontSize: 13, paddingHorizontal: 16 },
  eventRow: { flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 8, gap: 12, borderBottomWidth: 1, borderBottomColor: '#111' },
  eventTime: { color: colors.textSecondary, fontSize: 12, fontFamily: 'monospace' },
  eventType: { fontSize: 12, fontWeight: '700' },
  eventLane: { color: colors.textSecondary, fontSize: 12 },
});
