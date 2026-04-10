// Local Storage — SQLite + SHA-256 hash chain (append-only audit)
// All data stays on device. No cloud telemetry.

import * as SQLite from 'expo-sqlite';
import * as Crypto from 'expo-crypto';
import { sanitize } from '../config/opsec';
import type { AuditEntry } from '../types';

let db: SQLite.SQLiteDatabase | null = null;

export async function initDb(): Promise<void> {
  db = await SQLite.openDatabaseAsync('gagi_command_center.db');
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS audit_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      timestamp INTEGER NOT NULL,
      eventType TEXT NOT NULL,
      targetLane TEXT NOT NULL,
      traceId TEXT NOT NULL,
      hash TEXT NOT NULL,
      prevHash TEXT NOT NULL,
      payloadJson TEXT NOT NULL,
      seq INTEGER NOT NULL
    );
  `);
}

export async function getLastAuditEntry(): Promise<{ hash: string; seq: number } | null> {
  if (!db) return null;
  const row = await db.getFirstAsync<{ hash: string; seq: number }>(
    'SELECT hash, seq FROM audit_log ORDER BY seq DESC LIMIT 1'
  );
  return row ?? null;
}

export async function appendAudit(
  eventType: string,
  targetLane: string,
  traceId: string,
  payloadJson: string
): Promise<AuditEntry> {
  if (!db) throw new Error('DB not initialized');

  const last = await getLastAuditEntry();
  const seq = last ? last.seq + 1 : 1;
  const prevHash = last ? last.hash : '0000000000000000';
  const timestamp = Date.now();

  payloadJson = sanitize(payloadJson);

  const hashInput = `${prevHash}|${payloadJson}|${timestamp}|${traceId}|${seq}`;
  const hash = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    hashInput
  );

  await db.runAsync(
    'INSERT INTO audit_log (timestamp, eventType, targetLane, traceId, hash, prevHash, payloadJson, seq) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    [timestamp, eventType, targetLane, traceId, hash, prevHash, payloadJson, seq]
  );

  return { id: seq, timestamp, eventType, targetLane, traceId, hash, prevHash, payloadJson, seq };
}

export async function getAuditLog(limit: number = 50): Promise<AuditEntry[]> {
  if (!db) return [];
  return await db.getAllAsync<AuditEntry>(
    'SELECT * FROM audit_log ORDER BY seq DESC LIMIT ?',
    [limit]
  );
}

export async function verifyChain(): Promise<boolean> {
  if (!db) return false;
  const entries = await db.getAllAsync<AuditEntry>(
    'SELECT * FROM audit_log ORDER BY seq ASC'
  );

  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i];
    const expectedPrev = i === 0 ? '0000000000000000' : entries[i - 1].hash;
    if (entry.prevHash !== expectedPrev) return false;

    const hashInput = `${entry.prevHash}|${entry.payloadJson}|${entry.timestamp}|${entry.traceId}|${entry.seq}`;
    const computed = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      hashInput
    );
    if (computed !== entry.hash) return false;
  }
  return true;
}
