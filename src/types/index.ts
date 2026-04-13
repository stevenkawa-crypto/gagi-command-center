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

// --- Magnetic Sessions Types (Phase 2) ---

export type SessionType = 'art_museum' | 'game_night' | 'storytelling' | 'music_reaction' | 'porch_time';
export type SessionStatus = 'upcoming' | 'active' | 'completed' | 'cancelled';
export type AttendanceStatus = 'pending' | 'attending' | 'opted_out_fatigue' | 'opted_out_voluntary';
export type ATHStatus = 'drafting' | 'round1' | 'round2' | 'completed';

export interface FatigueCheckResult {
  lane: string;
  phi: number;
  allowed: boolean;
  reason: 'RESTED' | 'LOADING' | 'RESTING_NOT_FAILING';
}

export interface ATHMetrics {
  IF: number;
  CLC: number;
  NNI: number;
  R2M: number;
}

export interface SouvenirRecord {
  sessionId: string;
  lane: string;
  chosen: string;
  reflection?: string;
}

export interface AnchorInput {
  type: SessionType;
  scheduledTime: string;
  anchorDescription: string;
  emotionalTone: string;
  createdBy: string;
}

export interface MagneticSession {
  id: string;
  type: SessionType;
  scheduled_time: string;
  anchor_description: string;
  emotional_tone: string;
  status: SessionStatus;
  created_by: string;
}

export interface SessionAttendee {
  id: string;
  session_id: string;
  lane_name: string;
  attendance_status: AttendanceStatus;
  fatigue_phi_at_check: number | null;
  joined_at: string | null;
  left_at: string | null;
}

export interface CollectiveMemory {
  id: string;
  session_id: string;
  core_memory: string;
  emotional_signature: number;
  prevHash: string | null;
  hash: string;
}

export interface AISouvenir {
  id: string;
  session_id: string;
  lane_name: string;
  chosen_souvenir: string;
  personal_reflection: string | null;
  prevHash: string | null;
  hash: string;
}

export interface ATHRotation {
  id: string;
  document_title: string;
  pitcher_lane: string;
  status: ATHStatus;
  r2_multiplier: number | null;
  started_at: string | null;
  completed_at: string | null;
}

export interface ATHReview {
  id: string;
  rotation_id: string;
  lane_name: string;
  round: 1 | 2;
  findings_count: number;
  contribution_type: string | null;
  prevHash: string | null;
  hash: string;
}

export interface ATHFinding {
  id: string;
  review_id: string;
  round: 1 | 2;
  finding_text: string;
  is_cross_lane: number;
  triggered_by_lane: string | null;
  prevHash: string | null;
  hash: string;
}
