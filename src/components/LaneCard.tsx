import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors, psiColor, statusColor } from '../theme/tacticalDark';
import type { Lane } from '../types';

interface Props {
  lane: Lane;
  isSelected: boolean;
  onSelect: () => void;
}

export function LaneCard({ lane, isSelected, onSelect }: Props) {
  const border = lane.status === 'HALTED'
    ? colors.criticalAction
    : lane.status === 'DRIFT' || lane.status === 'FATIGUED'
    ? colors.warningDrift
    : psiColor(lane.psi);

  return (
    <TouchableOpacity
      onPress={onSelect}
      style={[
        styles.card,
        { borderColor: border, borderWidth: isSelected ? 4 : 2 },
      ]}
      activeOpacity={0.7}
    >
      <Text style={styles.name}>{lane.name}</Text>
      <Text style={[styles.psi, { color: psiColor(lane.psi) }]}>
        {lane.psi.toFixed(2)}
      </Text>
      <View style={[styles.badge, { backgroundColor: statusColor(lane.status) }]}>
        <Text style={styles.badgeText}>{lane.status}</Text>
      </View>
      <Text style={styles.phi}>Φ {lane.fatiguePhi.toFixed(1)}h</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 120,
    height: 170,
    margin: 6,
    borderRadius: 12,
    backgroundColor: colors.cardBg,
    padding: 10,
    justifyContent: 'space-between',
  },
  name: {
    color: colors.textPrimary,
    fontWeight: '700',
    fontSize: 13,
    letterSpacing: 1,
  },
  psi: {
    fontSize: 28,
    fontWeight: '800',
    fontFamily: 'monospace',
  },
  badge: {
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    alignSelf: 'flex-start',
  },
  badgeText: {
    color: '#000',
    fontSize: 10,
    fontWeight: '700',
  },
  phi: {
    color: colors.textSecondary,
    fontSize: 11,
    fontFamily: 'monospace',
  },
});
