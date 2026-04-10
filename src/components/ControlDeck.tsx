import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors } from '../theme/tacticalDark';

interface Props {
  onHaltAll: () => void;
  onNewDirective: () => void;
  onAuditLog: () => void;
  halted: boolean;
}

export function ControlDeck({ onHaltAll, onNewDirective, onAuditLog, halted }: Props) {
  return (
    <View style={styles.container}>
      <TouchableOpacity
        onPress={onHaltAll}
        style={[styles.btn, styles.haltBtn]}
        activeOpacity={0.7}
      >
        <Text style={styles.btnIcon}>⛔</Text>
        <Text style={styles.haltText}>{halted ? 'RESUME' : 'HALT'}</Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={onNewDirective}
        style={[styles.btn, styles.directiveBtn]}
        activeOpacity={0.7}
      >
        <Text style={styles.btnIcon}>➕</Text>
        <Text style={styles.directiveText}>DIRECTIVE</Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={onAuditLog}
        style={[styles.btn, styles.auditBtn]}
        activeOpacity={0.7}
      >
        <Text style={styles.btnIcon}>📋</Text>
        <Text style={styles.auditText}>AUDIT</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 70,
    backgroundColor: colors.controlDeckBg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 12,
    borderTopWidth: 1,
    borderTopColor: '#222',
  },
  btn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    marginHorizontal: 4,
    borderRadius: 8,
    minHeight: 48,
  },
  btnIcon: { fontSize: 18 },
  haltBtn: { backgroundColor: colors.criticalAction + '22' },
  haltText: { color: colors.criticalAction, fontSize: 11, fontWeight: '700', marginTop: 2 },
  directiveBtn: { backgroundColor: colors.primaryAction + '22' },
  directiveText: { color: colors.primaryAction, fontSize: 11, fontWeight: '700', marginTop: 2 },
  auditBtn: { backgroundColor: colors.auditButton + '22' },
  auditText: { color: colors.textSecondary, fontSize: 11, fontWeight: '700', marginTop: 2 },
});
