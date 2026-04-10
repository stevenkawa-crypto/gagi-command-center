// GAGI Command Center v2.0 — Core Types

export type LaneStatus = 'IDLE' | 'PROCESSING' | 'HALTED' | 'DRIFT' | 'FATIGUED' | 'DEPLETED';
export type NetMode = 'LOCAL' | 'SOVEREIGN' | 'CLOUD';
export type DirectiveType = 'DIRECTIVE' | 'QUERY' | 'HALT' | 'REVOKE' | 'AUDIT';
export type BlastRadius = 'GLOBAL' | 'LANE' | 'DIRECTIVE';

export interface Lane {
  id: string;
  name: string;
  psi: number;
  fatiguePhi: number;
  status: LaneStatus;
  lastEvent: string;
}

export interface NCLDirective {
  target: string;
  type: DirectiveType;
  payload: string;
  requiresCpnApproval: boolean;
  highSensitivity: boolean;
  blastRadius: BlastRadius;
  traceId?: string;
  issuedBy: string;
  timestamp: number;
}

export interface AuditEntry {
  id: number;
  timestamp: number;
  eventType: string;
  targetLane: string;
  traceId: string;
  hash: string;
  prevHash: string;
  payloadJson: string;
  seq: number;
}

export interface TelemetryInput {
  A: number;
  tauCoh: number;
  G_int: number;
  entropyVar: number;
  shutdowns: number;
}

export interface FatigueInput {
  baselineLatency: number;
  directives24h: number;
  complexityWeight: number;
  integrityGap: number;
  pendingQueue: number;
  omega?: number;
}

export interface PsiUpdate {
  laneId: string;
  psi: number;
}

export interface StatusChange {
  laneId: string;
  status: LaneStatus;
}
