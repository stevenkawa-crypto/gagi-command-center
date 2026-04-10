// Telemetry Engine — Ψ (Stability) and Φ (Fatigue) computation
// Formulas match governance spec exactly — do not modify without IG review

import type { TelemetryInput, FatigueInput, LaneStatus } from '../types';

export function computePsi(input: TelemetryInput): number {
  const raw = (input.A * input.tauCoh) / (input.G_int + input.entropyVar + (input.shutdowns * 0.5));
  return Math.min(Math.max(raw / 4.0, 0.0), 1.0);
}

export function computePhi(input: FatigueInput): number {
  const C_reserve = input.baselineLatency * 10;
  const L_cumulative = input.directives24h * input.complexityWeight;
  const G_weighted = input.integrityGap * (input.omega || 2.5);
  const denom = L_cumulative + G_weighted + input.pendingQueue;
  return denom === 0 ? 24.0 : Math.round((C_reserve / denom) * 100) / 100;
}

export function phiStatus(phi: number): LaneStatus {
  if (phi > 6) return 'IDLE';       // RESTED
  if (phi >= 3) return 'PROCESSING'; // LOADING
  if (phi >= 1) return 'FATIGUED';
  return 'DEPLETED';
}

export function psiThreshold(psi: number): 'UNSTABLE' | 'TUNING' | 'STABLE-95' {
  if (psi < 0.5) return 'UNSTABLE';
  if (psi < 0.95) return 'TUNING';
  return 'STABLE-95';
}
