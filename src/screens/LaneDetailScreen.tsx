import React from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { colors, psiColor, statusColor } from '../theme/tacticalDark';
import { psiThreshold } from '../services/telemetryEngine';
import type { Lane, AuditEntry } from '../types';

interface Props {
  lane: Lane;
  recentAudit: AuditEntry[];
}

export function LaneDetailScreen({ lane, recentAudit }: Props) {
  const laneAudit = recentAudit.filter(e => e.targetLane === lane.id || e.targetLane === 'ALL');
  const threshold = psiThreshold(lane.psi);

  return (
    <View style={styles.container}>
      {/* Lane Header */}
      <View style={styles.header}>
        <Text style={styles.name}>{lane.name}</Text>
        <View style={[styles.statusBadge, { backgroundColor: statusColor(lane.status) }]}>
          <Text style={styles.statusText}>{lane.status}</Text>
        </View>
      </View>

      {/* Metrics Row */}
      <View style={styles.metricsRow}>
        <View style={styles.metricBox}>
          <Text style={styles.metricLabel}>Ψ STABILITY</Text>
          <Text style={[styles.metricValue, { color: psiColor(lane.psi) }]}>{lane.psi.toFixed(3)}</Text>
          <Text style={[styles.metricSub, { color: psiColor(lane.psi) }]}>{threshold}</Text>
        </View>
        <View style={styles.metricBox}>
          <Text style={styles.metricLabel}>Φ FATIGUE</Text>
          <Text style={[styles.metricValue, { color: lane.fatiguePhi < 3 ? colors.criticalAction : colors.textPrimary }]}>
            {lane.fatiguePhi.toFixed(1)}h
          </Text>
          <Text style={styles.metricSub}>
            {lane.fatiguePhi > 6 ? 'RESTED' : lane.fatiguePhi >= 3 ? 'LOADING' : lane.fatiguePhi >= 1 ? 'FATIGUED' : 'DEPLETED'}
          </Text>
        </View>
      </View>

      {/* Psi Bar Visualization */}
      <View style={styles.barContainer}>
        <Text style={styles.barLabel}>Ψ TRAJECTORY</Text>
        <View style={styles.barTrack}>
          <View style={[styles.barFill, { width: `${lane.psi * 100}%`, backgroundColor: psiColor(lane.psi) }]} />
        </View>
        <View style={styles.barMarkers}>
          <Text style={styles.barMarker}>0.0</Text>
          <Text style={[styles.barMarker, { color: colors.criticalAction }]}>0.5</Text>
          <Text style={[styles.barMarker, { color: colors.warningDrift }]}>0.8</Text>
          <Text style={[styles.barMarker, { color: colors.successStable }]}>0.95</Text>
          <Text style={styles.barMarker}>1.0</Text>
        </View>
      </View>

      {/* Lane Audit Trail */}
      <Text style={styles.sectionTitle}>AUDIT TRAIL</Text>
      {laneAudit.length === 0 ? (
        <Text style={styles.empty}>No events for this lane.</Text>
      ) : (
        <FlatList
          data={laneAudit.slice(0, 20)}
          keyExtractor={item => String(item.seq)}
          renderItem={({ item }) => (
            <View style={styles.auditRow}>
              <Text style={styles.auditTime}>
                {new Date(item.timestamp).toLocaleTimeString('en-US', { hour12: false })}
              </Text>
              <Text style={styles.auditEvent}>{item.eventType}</Text>
              <Text style={styles.auditHash}>{item.hash.slice(0, 10)}...</Text>
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: 16 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  name: { color: colors.textPrimary, fontSize: 22, fontWeight: '800', letterSpacing: 2 },
  statusBadge: { borderRadius: 6, paddingHorizontal: 10, paddingVertical: 4 },
  statusText: { color: '#000', fontSize: 12, fontWeight: '800' },
  metricsRow: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 20 },
  metricBox: { alignItems: 'center' },
  metricLabel: { color: colors.textSecondary, fontSize: 10, fontWeight: '700', letterSpacing: 1 },
  metricValue: { fontSize: 32, fontWeight: '800', fontFamily: 'monospace', marginTop: 4 },
  metricSub: { color: colors.textSecondary, fontSize: 11, marginTop: 2 },
  barContainer: { marginBottom: 20 },
  barLabel: { color: colors.textSecondary, fontSize: 10, fontWeight: '700', letterSpacing: 1, marginBottom: 6 },
  barTrack: { height: 8, backgroundColor: '#222', borderRadius: 4, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 4 },
  barMarkers: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 },
  barMarker: { color: colors.textSecondary, fontSize: 9, fontFamily: 'monospace' },
  sectionTitle: { color: colors.textSecondary, fontSize: 11, fontWeight: '700', letterSpacing: 2, marginBottom: 8 },
  empty: { color: colors.textSecondary, fontSize: 13 },
  auditRow: { flexDirection: 'row', paddingVertical: 6, gap: 10, borderBottomWidth: 1, borderBottomColor: '#111' },
  auditTime: { color: colors.textSecondary, fontSize: 11, fontFamily: 'monospace' },
  auditEvent: { color: colors.textPrimary, fontSize: 11, fontWeight: '600' },
  auditHash: { color: colors.textSecondary, fontSize: 10, fontFamily: 'monospace' },
});
