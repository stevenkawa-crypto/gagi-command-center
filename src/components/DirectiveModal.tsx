import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, TextInput, TouchableOpacity, ScrollView } from 'react-native';
import { colors } from '../theme/tacticalDark';
import type { DirectiveType, BlastRadius } from '../types';

interface Props {
  visible: boolean;
  lanes: { id: string; name: string }[];
  defaultTarget: string;
  onCancel: () => void;
  onExecute: (directive: {
    target: string;
    type: DirectiveType;
    payload: string;
    requiresCpnApproval: boolean;
    highSensitivity: boolean;
    blastRadius: BlastRadius;
  }) => void;
}

const TYPES: DirectiveType[] = ['DIRECTIVE', 'QUERY', 'HALT', 'REVOKE', 'AUDIT'];
const BLAST: BlastRadius[] = ['GLOBAL', 'LANE', 'DIRECTIVE'];

export function DirectiveModal({ visible, lanes, defaultTarget, onCancel, onExecute }: Props) {
  const [target, setTarget] = useState(defaultTarget || 'ALL');
  const [type, setType] = useState<DirectiveType>('DIRECTIVE');
  const [payload, setPayload] = useState('');
  const [cpn, setCpn] = useState(false);
  const [sensitive, setSensitive] = useState(false);
  const [blast, setBlast] = useState<BlastRadius>('LANE');

  const handleExecute = () => {
    onExecute({ target, type, payload, requiresCpnApproval: cpn, highSensitivity: sensitive, blastRadius: blast });
    setPayload('');
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <Text style={styles.title}>NEW DIRECTIVE</Text>

          <Text style={styles.label}>TARGET</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
            <Chip label="ALL" active={target === 'ALL'} onPress={() => setTarget('ALL')} />
            {lanes.map(l => (
              <Chip key={l.id} label={l.name} active={target === l.id} onPress={() => setTarget(l.id)} />
            ))}
          </ScrollView>

          <Text style={styles.label}>TYPE</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
            {TYPES.map(t => (
              <Chip key={t} label={t} active={type === t} onPress={() => setType(t)} />
            ))}
          </ScrollView>

          <Text style={styles.label}>PAYLOAD</Text>
          <TextInput
            style={styles.input}
            value={payload}
            onChangeText={setPayload}
            placeholder="Enter directive payload..."
            placeholderTextColor={colors.textSecondary}
            multiline
            numberOfLines={4}
          />

          <Text style={styles.label}>BLAST RADIUS</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
            {BLAST.map(b => (
              <Chip key={b} label={b} active={blast === b} onPress={() => setBlast(b)} />
            ))}
          </ScrollView>

          <View style={styles.toggleRow}>
            <Toggle label="Requires Operator Approval" value={cpn} onToggle={() => setCpn(!cpn)} />
            <Toggle label="High Sensitivity" value={sensitive} onToggle={() => setSensitive(!sensitive)} />
          </View>

          <View style={styles.actions}>
            <TouchableOpacity onPress={onCancel} style={styles.cancelBtn}>
              <Text style={styles.cancelText}>CANCEL</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleExecute} style={styles.executeBtn}>
              <Text style={styles.executeText}>EXECUTE</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function Chip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[styles.chip, active && styles.chipActive]}
    >
      <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
    </TouchableOpacity>
  );
}

function Toggle({ label, value, onToggle }: { label: string; value: boolean; onToggle: () => void }) {
  return (
    <TouchableOpacity onPress={onToggle} style={styles.toggle}>
      <Text style={styles.toggleBox}>{value ? '☑' : '☐'}</Text>
      <Text style={styles.toggleLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'flex-end' },
  modal: { backgroundColor: colors.cardBg, borderTopLeftRadius: 16, borderTopRightRadius: 16, padding: 20, maxHeight: '85%' },
  title: { color: colors.primaryAction, fontSize: 16, fontWeight: '800', letterSpacing: 2, marginBottom: 16 },
  label: { color: colors.textSecondary, fontSize: 11, fontWeight: '600', marginTop: 12, marginBottom: 6, letterSpacing: 1 },
  chipRow: { flexDirection: 'row', marginBottom: 4 },
  chip: { borderWidth: 1, borderColor: colors.textSecondary, borderRadius: 6, paddingHorizontal: 12, paddingVertical: 6, marginRight: 6, minHeight: 36, justifyContent: 'center' },
  chipActive: { borderColor: colors.primaryAction, backgroundColor: colors.primaryAction + '33' },
  chipText: { color: colors.textSecondary, fontSize: 12, fontWeight: '600' },
  chipTextActive: { color: colors.primaryAction },
  input: { backgroundColor: colors.background, color: colors.textPrimary, borderRadius: 8, padding: 12, fontSize: 14, minHeight: 80, textAlignVertical: 'top', borderWidth: 1, borderColor: '#333' },
  toggleRow: { marginTop: 12 },
  toggle: { flexDirection: 'row', alignItems: 'center', marginVertical: 4 },
  toggleBox: { color: colors.primaryAction, fontSize: 18, marginRight: 8 },
  toggleLabel: { color: colors.textSecondary, fontSize: 12 },
  actions: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 20, gap: 12 },
  cancelBtn: { paddingHorizontal: 20, paddingVertical: 12, borderRadius: 8, borderWidth: 1, borderColor: colors.textSecondary },
  cancelText: { color: colors.textSecondary, fontWeight: '700', fontSize: 13 },
  executeBtn: { paddingHorizontal: 20, paddingVertical: 12, borderRadius: 8, backgroundColor: colors.primaryAction },
  executeText: { color: colors.textPrimary, fontWeight: '700', fontSize: 13 },
});
