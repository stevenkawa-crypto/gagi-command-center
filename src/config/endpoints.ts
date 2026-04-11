// Endpoint configuration — point to CCW server on local network
// Change BASE_URL to your laptop's LAN IP when testing on device

export const BASE_URL = 'http://192.168.4.29:8000';

export const ENDPOINTS = {
  health: '/health',
  chat: '/chat',
  group: '/group',
  query: '/query',
  audit: '/audit',
  notifications: '/notifications',
  providers: '/providers',
  save: '/save',
  nclExecute: '/ncl/execute',
  taskSubmit: '/task/submit',
  taskStatus: (id: string) => `/task/${id}`,
  taskHalt: '/task/halt',
  wakeUpBrief: '/wake-up/brief',
  telemetryLanes: '/telemetry/lanes',
  wsTelemetry: '/ws/telemetry',
} as const;

export function wsUrl(): string {
  return BASE_URL.replace(/^http/, 'ws') + ENDPOINTS.wsTelemetry;
}
