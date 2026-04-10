// Tactical Dark Theme — GAGI Command Center v2.0

export const colors = {
  background: '#0F0F0F',
  cardBg: '#1A1A1A',
  primaryAction: '#9D4EDD',
  criticalAction: '#FF4444',
  successStable: '#44FF44',
  warningDrift: '#FFAA00',
  textPrimary: '#FFFFFF',
  textSecondary: '#AAAAAA',
  controlDeckBg: '#1A1A1A',
  auditButton: '#555555',
} as const;

export function psiColor(psi: number): string {
  if (psi > 0.9) return colors.successStable;
  if (psi >= 0.5) return colors.warningDrift;
  return colors.criticalAction;
}

export function statusColor(status: string): string {
  switch (status) {
    case 'HALTED': return colors.criticalAction;
    case 'DRIFT': return colors.warningDrift;
    case 'FATIGUED': return colors.warningDrift;
    case 'DEPLETED': return colors.criticalAction;
    case 'IDLE': return colors.successStable;
    case 'PROCESSING': return colors.primaryAction;
    default: return colors.textSecondary;
  }
}
