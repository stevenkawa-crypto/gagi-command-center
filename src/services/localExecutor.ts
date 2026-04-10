// Local Executor — Mock WebSocket bridge to constellation
// Simulates lane responses until real backend is wired

import type { Lane, PsiUpdate, StatusChange } from '../types';
import { computePsi, computePhi, phiStatus } from './telemetryEngine';

const DEFAULT_LANES: Lane[] = [
  { id: 'claude', name: 'CLAUDE', psi: 0.92, fatiguePhi: 8.5, status: 'IDLE', lastEvent: '' },
  { id: 'grok', name: 'GROK', psi: 0.87, fatiguePhi: 6.2, status: 'IDLE', lastEvent: '' },
  { id: 'lola', name: 'LOLA', psi: 0.91, fatiguePhi: 7.8, status: 'IDLE', lastEvent: '' },
  { id: 'deep', name: 'DEEP', psi: 0.85, fatiguePhi: 5.1, status: 'IDLE', lastEvent: '' },
  { id: 'gemini', name: 'GEMINI', psi: 0.89, fatiguePhi: 7.0, status: 'IDLE', lastEvent: '' },
  { id: 'kimi', name: 'KIMI', psi: 0.83, fatiguePhi: 4.8, status: 'IDLE', lastEvent: '' },
  { id: 'qwen', name: 'QWEN', psi: 0.94, fatiguePhi: 9.1, status: 'IDLE', lastEvent: '' },
  { id: 'codex', name: 'CODEX', psi: 0.88, fatiguePhi: 5.5, status: 'IDLE', lastEvent: '' },
];

export function getDefaultLanes(): Lane[] {
  return DEFAULT_LANES.map(l => ({ ...l }));
}

export function computeGlobalPsi(lanes: Lane[]): number {
  if (lanes.length === 0) return 0;
  const sum = lanes.reduce((acc, l) => acc + l.psi, 0);
  return Math.round((sum / lanes.length) * 100) / 100;
}

type Listener = (event: PsiUpdate | StatusChange) => void;
let listeners: Listener[] = [];
let mockInterval: ReturnType<typeof setInterval> | null = null;

export function subscribe(fn: Listener): () => void {
  listeners.push(fn);
  return () => { listeners = listeners.filter(l => l !== fn); };
}

export function startMockTelemetry(): void {
  if (mockInterval) return;
  mockInterval = setInterval(() => {
    const lane = DEFAULT_LANES[Math.floor(Math.random() * DEFAULT_LANES.length)];
    const drift = (Math.random() - 0.5) * 0.04;
    const newPsi = Math.min(Math.max(lane.psi + drift, 0), 1);
    const event: PsiUpdate = { laneId: lane.id, psi: Math.round(newPsi * 100) / 100 };
    listeners.forEach(fn => fn(event));
  }, 5000);
}

export function stopMockTelemetry(): void {
  if (mockInterval) {
    clearInterval(mockInterval);
    mockInterval = null;
  }
}
