// NCL Parser — Validate and construct directives with trace IDs
// Directive Syntax spec: 13 types, governance metadata required

import type { NCLDirective, DirectiveType, BlastRadius } from '../types';

const VALID_TYPES: DirectiveType[] = ['DIRECTIVE', 'QUERY', 'HALT', 'REVOKE', 'AUDIT'];
const VALID_BLAST: BlastRadius[] = ['GLOBAL', 'LANE', 'DIRECTIVE'];

export function generateTraceId(): string {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const digits = '0123456789';
  const rc = Array.from({ length: 3 }, () => chars[Math.floor(Math.random() * 26)]).join('');
  const rd = Array.from({ length: 3 }, () => digits[Math.floor(Math.random() * 10)]).join('');
  return `NP-${date}-${rc}-${rd}`;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export function validate(directive: Partial<NCLDirective>): ValidationResult {
  const errors: string[] = [];

  if (!directive.target) errors.push('Target is required');
  if (!directive.type || !VALID_TYPES.includes(directive.type)) errors.push('Invalid directive type');
  if (!directive.payload?.trim()) errors.push('Payload cannot be empty');
  if (directive.blastRadius && !VALID_BLAST.includes(directive.blastRadius)) errors.push('Invalid blast radius');

  if (directive.type === 'HALT' && directive.blastRadius !== 'GLOBAL' && directive.blastRadius !== 'LANE') {
    errors.push('HALT directives require GLOBAL or LANE blast radius');
  }

  return { valid: errors.length === 0, errors };
}

export function buildDirective(partial: {
  target: string;
  type: DirectiveType;
  payload: string;
  requiresCpnApproval: boolean;
  highSensitivity: boolean;
  blastRadius: BlastRadius;
}): NCLDirective {
  return {
    ...partial,
    traceId: generateTraceId(),
    issuedBy: 'Operator',
    timestamp: Date.now(),
  };
}
