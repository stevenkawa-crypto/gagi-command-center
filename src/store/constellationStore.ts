// Constellation Store — Zustand state management
// Lane-first architecture: lanes are the primary unit, not messages
// Online: routes through apiClient to CCW server
// Offline: falls back to local mock data

import { create } from 'zustand';
import type { Lane, NCLDirective, LaneStatus } from '../types';
import { getDefaultLanes, computeGlobalPsi } from '../services/localExecutor';
import { buildDirective, generateTraceId } from '../services/nclParser';
import { appendAudit } from '../services/storage';
import * as api from '../services/apiClient';

interface ConstellationStore {
  lanes: Lane[];
  selectedLaneId: string | null;
  globalPsi: number;
  halted: boolean;

  selectLane: (id: string | null) => void;
  seedFromServer: () => Promise<void>;
  addDirective: (directive: NCLDirective) => Promise<string>;
  haltAll: () => void;
  resumeAll: () => void;
  revokeDirective: (traceId: string) => void;
  updateLanePsi: (laneId: string, psi: number) => void;
  updateLaneStatus: (laneId: string, status: LaneStatus) => void;
  setLanes: (lanes: Lane[]) => void;
}

export const useConstellationStore = create<ConstellationStore>((set, get) => ({
  lanes: getDefaultLanes(),
  selectedLaneId: null,
  globalPsi: computeGlobalPsi(getDefaultLanes()),
  halted: false,

  selectLane: (id) => set({ selectedLaneId: id }),

  seedFromServer: async () => {
    const serverLanes = await api.fetchLanes();
    if (serverLanes && serverLanes.length > 0) {
      set({ lanes: serverLanes, globalPsi: computeGlobalPsi(serverLanes) });
    }
  },

  addDirective: async (directive) => {
    const traceId = directive.traceId || generateTraceId();

    // Try server-side NCL execution first
    if (api.isOnline()) {
      const result = await api.submitDirective({
        type: directive.type,
        name: directive.payload.slice(0, 50),
        assign: directive.target === 'ALL' ? 'coding' : directive.target,
        priority: directive.highSensitivity ? 'HIGH' : 'LOW',
        gate: directive.requiresCpnApproval ? 'Tier3' : 'Tier1',
        timeout: '5m',
        description: directive.payload,
      });

      if (result) {
        await appendAudit(
          `DIRECTIVE_${directive.type}`,
          directive.target,
          result.trace_id,
          JSON.stringify({ ...directive, serverResponse: result.status })
        );
        return result.trace_id;
      }
    }

    // Fallback: local-only audit + mock processing
    await appendAudit(
      `DIRECTIVE_${directive.type}`,
      directive.target,
      traceId,
      JSON.stringify(directive)
    );

    set((state) => ({
      lanes: state.lanes.map(l =>
        l.id === directive.target || directive.target === 'ALL'
          ? { ...l, status: 'PROCESSING' as LaneStatus, lastEvent: traceId }
          : l
      ),
    }));

    setTimeout(() => {
      set((state) => ({
        lanes: state.lanes.map(l =>
          l.lastEvent === traceId ? { ...l, status: 'IDLE' as LaneStatus } : l
        ),
      }));
    }, 2000);

    return traceId;
  },

  haltAll: () => {
    const traceId = generateTraceId();
    appendAudit('HALT_ALL', 'ALL', traceId, '{"scope":"GLOBAL"}');
    set((state) => ({
      halted: true,
      lanes: state.lanes.map(l => ({ ...l, status: 'HALTED' as LaneStatus, lastEvent: traceId })),
    }));
  },

  resumeAll: () => {
    const traceId = generateTraceId();
    appendAudit('RESUME_ALL', 'ALL', traceId, '{"scope":"GLOBAL"}');
    set((state) => ({
      halted: false,
      lanes: state.lanes.map(l => ({ ...l, status: 'IDLE' as LaneStatus, lastEvent: traceId })),
    }));
  },

  revokeDirective: (traceId) => {
    appendAudit('REVOKE', 'UNKNOWN', traceId, JSON.stringify({ revokedTraceId: traceId }));
  },

  updateLanePsi: (laneId, psi) => {
    set((state) => {
      const lanes = state.lanes.map(l => l.id === laneId ? { ...l, psi } : l);
      return { lanes, globalPsi: computeGlobalPsi(lanes) };
    });
  },

  updateLaneStatus: (laneId, status) => {
    set((state) => ({
      lanes: state.lanes.map(l => l.id === laneId ? { ...l, status } : l),
    }));
  },

  setLanes: (lanes) => set({ lanes, globalPsi: computeGlobalPsi(lanes) }),
}));
