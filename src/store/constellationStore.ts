// Constellation Store — Zustand state management
// Lane-first architecture: lanes are the primary unit, not messages

import { create } from 'zustand';
import type { Lane, NCLDirective, TelemetryInput, LaneStatus } from '../types';
import { getDefaultLanes, computeGlobalPsi } from '../services/localExecutor';
import { computePsi, computePhi, phiStatus } from '../services/telemetryEngine';
import { buildDirective, generateTraceId } from '../services/nclParser';
import { appendAudit } from '../services/storage';

interface ConstellationStore {
  lanes: Lane[];
  selectedLaneId: string | null;
  globalPsi: number;
  halted: boolean;

  selectLane: (id: string | null) => void;
  addDirective: (directive: NCLDirective) => Promise<string>;
  haltAll: () => void;
  resumeAll: () => void;
  revokeDirective: (traceId: string) => void;
  updateLanePsi: (laneId: string, psi: number) => void;
  updateLaneStatus: (laneId: string, status: LaneStatus) => void;
}

export const useConstellationStore = create<ConstellationStore>((set, get) => ({
  lanes: getDefaultLanes(),
  selectedLaneId: null,
  globalPsi: computeGlobalPsi(getDefaultLanes()),
  halted: false,

  selectLane: (id) => set({ selectedLaneId: id }),

  addDirective: async (directive) => {
    const traceId = directive.traceId || generateTraceId();

    await appendAudit(
      `DIRECTIVE_${directive.type}`,
      directive.target,
      traceId,
      JSON.stringify(directive)
    );

    // Mark target lane as PROCESSING
    set((state) => ({
      lanes: state.lanes.map(l =>
        l.id === directive.target || directive.target === 'ALL'
          ? { ...l, status: 'PROCESSING' as LaneStatus, lastEvent: traceId }
          : l
      ),
    }));

    // Simulate completion after 2s
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
}));
