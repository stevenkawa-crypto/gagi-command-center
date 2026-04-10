import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors, psiColor } from '../theme/tacticalDark';
import type { NetMode } from '../types';

interface Props {
  globalPsi: number;
  netMode: NetMode;
  onToggleNet: () => void;
}

export function HeaderBar({ globalPsi, netMode, onToggleNet }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.logo}>GAGI CONSTELLATION</Text>
      <Text style={[styles.psi, { color: psiColor(globalPsi) }]}>
        Ψ {globalPsi.toFixed(2)}
      </Text>
      <TouchableOpacity onPress={onToggleNet} style={styles.netBadge}>
        <Text style={styles.netText}>{netMode}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 60,
    backgroundColor: colors.background,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#222',
  },
  logo: {
    color: colors.textPrimary,
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 1,
  },
  psi: {
    fontSize: 18,
    fontWeight: '800',
    fontFamily: 'monospace',
  },
  netBadge: {
    borderWidth: 1,
    borderColor: colors.textSecondary,
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  netText: {
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: '600',
  },
});
