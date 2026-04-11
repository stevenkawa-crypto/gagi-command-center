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
import * as api from './services/apiClient';
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
    selectLane, addDirective, haltAll, resumeAll, updateLanePsi, seedFromServer,
  } = useConstellationStore();

  const selectedLane = lanes.find(l => l.id === selectedLaneId) ?? null;

  // Init DB + probe server + seed lanes
  useEffect(() => {
    (async () => {
      await initDb();
      setDbReady(true);

      // Probe server and seed real lanes if reachable
      api.setMode(netMode);
      const online = await api.probeServer();
      if (online) {
        await seedFromServer();
      }

      const entries = await getAuditLog(50);
      setAuditEntries(entries);
      const valid = await verifyChain();
      setChainValid(valid);
    })();
  }, []);

  // Mock telemetry — runs when LOCAL or server unreachable
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
    // Merge local + server audit when online
    const localEntries = await getAuditLog(50);
    let merged = localEntries;

    if (api.isOnline()) {
      const serverEntries = await api.fetchAudit(24);
      if (serverEntries) {
        const localTraceIds = new Set(localEntries.map(e => e.traceId));
        const newServerEntries = serverEntries.filter(e => !localTraceIds.has(e.traceId));
        merged = [...localEntries, ...newServerEntries]
          .sort((a, b) => b.timestamp - a.timestamp)
          .slice(0, 100);
      }
    }

    setAuditEntries(merged);
    const valid = await verifyChain();
    setChainValid(valid);
  };

  const toggleNet = () => {
    const modes: NetMode[] = ['LOCAL', 'SOVEREIGN', 'CLOUD'];
    const idx = modes.indexOf(netMode);
    const next = modes[(idx + 1) % modes.length];
    setNetMode(next);
    api.setMode(next);

    // Re-seed lanes when switching to SOVEREIGN
    if (next !== 'LOCAL') {
      seedFromServer();
    }
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
