import React, { useEffect, useState } from 'react';
import { SafeAreaView, StatusBar, StyleSheet } from 'react-native';
import { colors } from './theme/tacticalDark';
import { HeaderBar } from './components/HeaderBar';
import { ControlDeck } from './components/ControlDeck';
import { DirectiveModal } from './components/DirectiveModal';
import { DashboardScreen } from './screens/DashboardScreen';
import { LaneDetailScreen } from './screens/LaneDetailScreen';
import { AuditScreen } from './screens/AuditScreen';
import { useConstellationStore } from './store/constellationStore';
import { initDb, getAuditLog, verifyChain } from './services/storage';
import { validate, buildDirective } from './services/nclParser';
import { startMockTelemetry, stopMockTelemetry, subscribe } from './services/localExecutor';
import type { NetMode, AuditEntry, PsiUpdate } from './types';

type Screen = 'dashboard' | 'audit';

export default function App() {
  const [netMode, setNetMode] = useState<NetMode>('SOVEREIGN');
  const [screen, setScreen] = useState<Screen>('dashboard');
  const [modalVisible, setModalVisible] = useState(false);
  const [auditEntries, setAuditEntries] = useState<AuditEntry[]>([]);
  const [chainValid, setChainValid] = useState(true);
  const [dbReady, setDbReady] = useState(false);

  const {
    lanes, selectedLaneId, globalPsi, halted,
    selectLane, addDirective, haltAll, resumeAll, updateLanePsi,
  } = useConstellationStore();

  const selectedLane = lanes.find(l => l.id === selectedLaneId) ?? null;

  useEffect(() => {
    (async () => {
      await initDb();
      setDbReady(true);
      const entries = await getAuditLog(50);
      setAuditEntries(entries);
      const valid = await verifyChain();
      setChainValid(valid);
    })();
  }, []);

  useEffect(() => {
    startMockTelemetry();
    const unsub = subscribe((event) => {
      if ('psi' in event) {
        updateLanePsi(event.laneId, (event as PsiUpdate).psi);
      }
    });
    return () => { stopMockTelemetry(); unsub(); };
  }, []);

  const refreshAudit = async () => {
    const entries = await getAuditLog(50);
    setAuditEntries(entries);
    const valid = await verifyChain();
    setChainValid(valid);
  };

  const toggleNet = () => {
    const modes: NetMode[] = ['LOCAL', 'SOVEREIGN', 'CLOUD'];
    const idx = modes.indexOf(netMode);
    setNetMode(modes[(idx + 1) % modes.length]);
  };

  const handleHalt = () => {
    if (halted) { resumeAll(); } else { haltAll(); }
    refreshAudit();
  };

  const handleExecute = async (d: Parameters<typeof buildDirective>[0]) => {
    const result = validate(d);
    if (!result.valid) return;
    const directive = buildDirective(d);
    await addDirective(directive);
    setModalVisible(false);
    refreshAudit();
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />
      <HeaderBar globalPsi={globalPsi} netMode={netMode} onToggleNet={toggleNet} />

      {screen === 'audit' ? (
        <AuditScreen entries={auditEntries} chainValid={chainValid} onBack={() => setScreen('dashboard')} />
      ) : selectedLane ? (
        <LaneDetailScreen lane={selectedLane} recentAudit={auditEntries} />
      ) : (
        <DashboardScreen recentAudit={auditEntries} />
      )}

      <ControlDeck
        halted={halted}
        onHaltAll={handleHalt}
        onNewDirective={() => setModalVisible(true)}
        onAuditLog={() => { refreshAudit(); setScreen(screen === 'audit' ? 'dashboard' : 'audit'); }}
      />

      <DirectiveModal
        visible={modalVisible}
        lanes={lanes.map(l => ({ id: l.id, name: l.name }))}
        defaultTarget={selectedLaneId || 'ALL'}
        onCancel={() => setModalVisible(false)}
        onExecute={handleExecute}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
});
