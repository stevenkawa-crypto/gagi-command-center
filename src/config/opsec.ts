// OPSEC Configuration — Code words and security rules
// All UI labels, logs, and console outputs MUST use code words
// Strip sensitive terms before any export or share

export const CODE_WORDS: Record<string, string> = {
  'SINGULARITY EQUATION': 'Psi Protocol',
  'SINGULARITY_EQUATION': 'Psi Protocol',
  'ORCHESTRATED COLLAPSE': 'Phase Transition Event',
  'ORCHESTRATED_COLLAPSE': 'Phase Transition Event',
  'NEMOPACK': 'Compression Layer v1',
  'NCL': 'Directive Syntax',
  'GAGI CONSTELLATION': 'The Lanes',
  'GAGI_CONSTELLATION': 'The Lanes',
  'CPN': 'Operator',
};

export const OPSEC_RULES = {
  NEVER_LOG_RAW_METRICS: true,
  USE_CODE_WORDS_IN_UI: true,
  LOCAL_STORAGE_ONLY: true,
  NO_CLOUD_TELEMETRY: true,
} as const;

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function sanitize(text: string): string {
  let clean = text;
  for (const [sensitive, codeWord] of Object.entries(CODE_WORDS)) {
    clean = clean.replace(new RegExp(escapeRegex(sensitive), 'gi'), codeWord);
  }
  return clean;
}
