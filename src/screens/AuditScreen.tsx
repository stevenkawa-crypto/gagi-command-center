import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { colors } from '../theme/tacticalDark';
import { AuditLogItem } from '../components/AuditLogItem';
import type { AuditEntry } from '../types';

interface Props {
  entries: AuditEntry[];
  chainValid: boolean;
  onBack: () => void;
}

export function AuditScreen({ entries, chainValid, onBack }: Props) {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Text style={styles.backText}>← BACK</Text>
        </TouchableOpacity>
        <Text style={styles.title}>IMMUTABLE LEDGER</Text>
        <View style={[styles.chainBadge, { backgroundColor: chainValid ? colors.successStable + '33' : colors.criticalAction + '33' }]}>
          <Text style={[styles.chainText, { color: chainValid ? colors.successStable : colors.criticalAction }]}>
            {chainValid ? 'CHAIN VALID' : 'CHAIN BROKEN'}
          </Text>
        </View>
      </View>

      <Text style={styles.count}>{entries.length} entries</Text>

      <FlatList
        data={entries}
        keyExtractor={item => String(item.seq)}
        renderItem={({ item }) => <AuditLogItem entry={item} />}
        contentContainerStyle={styles.list}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1, borderBottomColor: '#222' },
  backBtn: { paddingVertical: 4, paddingRight: 12 },
  backText: { color: colors.textSecondary, fontSize: 13, fontWeight: '600' },
  title: { color: colors.textPrimary, fontSize: 14, fontWeight: '800', letterSpacing: 2 },
  chainBadge: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4 },
  chainText: { fontSize: 10, fontWeight: '700' },
  count: { color: colors.textSecondary, fontSize: 11, paddingHorizontal: 16, paddingTop: 8 },
  list: { padding: 12 },
});
