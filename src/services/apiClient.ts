// API Client — Network abstraction with auto-detect and mock fallback
// LOCAL = always mock, SOVEREIGN = try server then fallback, CLOUD = future

import { BASE_URL, ENDPOINTS } from '../config/endpoints';
import { sanitize } from '../config/opsec';
import type { Lane, NetMode, LaneStatus, AuditEntry } from '../types';

let serverReachable = false;
let currentMode: NetMode = 'SOVEREIGN';
let heartbeatInterval: ReturnType<typeof setInterval> | null = null;

// --- Connection Management ---

export function setMode(mode: NetMode): void {
  currentMode = mode;
  if (mode === 'LOCAL') {
    serverReachable = false;
    stopHeartbeat();
  } else {
    probeServer();
    startHeartbeat();
  }
}

export function isOnline(): boolean {
  return currentMode !== 'LOCAL' && serverReachable;
}

export async function probeServer(): Promise<boolean> {
  if (currentMode === 'LOCAL') return false;
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    const res = await fetch(`${BASE_URL}${ENDPOINTS.health}`, { signal: controller.signal });
    clearTimeout(timeout);
    serverReachable = res.ok;
  } catch {
    serverReachable = false;
  }
  return serverReachable;
}

function startHeartbeat(): void {
  if (heartbeatInterval) return;
  heartbeatInterval = setInterval(() => probeServer(), 30000);
}

function stopHeartbeat(): void {
  if (heartbeatInterval) {
    clearInterval(heartbeatInterval);
    heartbeatInterval = null;
  }
}

// --- Typed API Calls ---

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T | null> {
  if (!isOnline()) return null;
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);
    const res = await fetch(`${BASE_URL}${path}`, {
      ...options,
      signal: controller.signal,
      headers: { 'Content-Type': 'application/json', ...options?.headers },
    });
    clearTimeout(timeout);
    if (!res.ok) return null;
    return await res.json() as T;
  } catch {
    serverReachable = false;
    return null;
  }
}

// --- Health / Lane Fetching ---

interface HealthLane {
  active: boolean;
  has_key: boolean;
  circuit_open: boolean;
  consecutive_failures: number;
  model_level: string;
}

interface HealthResponse {
  status: string;
  lanes: Record<string, HealthLane>;
}

export async function fetchLanes(): Promise<Lane[] | null> {
  const data = await apiFetch<HealthResponse>(ENDPOINTS.health);
  if (!data?.lanes) return null;

  return Object.entries(data.lanes).map(([id, lane]) => {
    let status: LaneStatus = 'IDLE';
    if (lane.circuit_open) status = 'HALTED';
    else if (!lane.active || !lane.has_key) status = 'DEPLETED';
    else if (lane.consecutive_failures > 0) status = 'DRIFT';

    return {
      id,
      name: id.toUpperCase(),
      psi: lane.circuit_open ? 0.3 : lane.consecutive_failures > 0 ? 0.6 : 0.9,
      fatiguePhi: lane.active ? 8.0 : 1.0,
      status,
      lastEvent: '',
    };
  });
}

// --- Chat / Query ---

interface ChatResponse {
  response: string;
  model: string;
  cost: number;
  trace_id?: string;
}

export async function chatLane(laneId: string, query: string): Promise<ChatResponse | null> {
  return apiFetch<ChatResponse>(ENDPOINTS.chat, {
    method: 'POST',
    body: JSON.stringify({ query: sanitize(query), lane: laneId, cpn_guidance: '' }),
  });
}

interface GroupResponse {
  responses: Record<string, { response: string; model: string; cost: number }>;
  consensus?: { score: number };
}

export async function groupChat(query: string): Promise<GroupResponse | null> {
  return apiFetch<GroupResponse>(ENDPOINTS.group, {
    method: 'POST',
    body: JSON.stringify({ query: sanitize(query), cpn_guidance: '' }),
  });
}

// --- Audit ---

interface ServerAuditEntry {
  timestamp: string;
  event_type: string;
  lane?: string;
  query?: string;
  trace_id?: string;
}

export async function fetchAudit(hours: number = 24): Promise<AuditEntry[] | null> {
  const data = await apiFetch<ServerAuditEntry[]>(`${ENDPOINTS.audit}?hours=${hours}`);
  if (!data) return null;

  return data.map((entry, i) => ({
    id: i,
    timestamp: new Date(entry.timestamp).getTime(),
    eventType: entry.event_type || 'UNKNOWN',
    targetLane: entry.lane || 'ALL',
    traceId: entry.trace_id || `server-${i}`,
    hash: '',
    prevHash: '',
    payloadJson: JSON.stringify(entry),
    seq: i,
  }));
}

// --- Notifications ---

interface Notification {
  type: string;
  message: string;
  timestamp: string;
  priority: string;
}

export async function fetchNotifications(): Promise<Notification[] | null> {
  return apiFetch<Notification[]>(ENDPOINTS.notifications);
}

// --- NCL Execution (Phase 2 — endpoint doesn't exist yet, will gracefully return null) ---

interface NclResponse {
  trace_id: string;
  status: string;
  pod_response: Record<string, unknown>;
  duration_ms: number;
  cost: number;
}

export async function submitDirective(directive: Record<string, unknown>): Promise<NclResponse | null> {
  return apiFetch<NclResponse>(ENDPOINTS.nclExecute, {
    method: 'POST',
    body: JSON.stringify(directive),
  });
}

// --- Task Submission (Phase 2) ---

interface TaskResponse {
  task_id: string;
  status: string;
}

export async function submitTask(description: string, priority: string): Promise<TaskResponse | null> {
  return apiFetch<TaskResponse>(ENDPOINTS.taskSubmit, {
    method: 'POST',
    body: JSON.stringify({ description, priority, requester: 'Operator' }),
  });
}
