// Local Storage — SQLite + SHA-256 hash chain (append-only audit)
// All data stays on device. No cloud telemetry.
// Phase 1: Added 7 Magnetic Sessions tables + generic chain helpers

import * as SQLite from 'expo-sqlite';
import * as Crypto from 'expo-crypto';
import { sanitize } from '../config/opsec';
import type { AuditEntry } from '../types';

let db: SQLite.SQLiteDatabase | null = null;

export function getDb(): SQLite.SQLiteDatabase | null { return db; }

export async function initDb(): Promise<void> {
  db = await SQLite.openDatabaseAsync('gagi_command_center.db');

  // Existing audit_log
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

  // --- Magnetic Sessions tables (Phase 1) ---

  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS magnetic_sessions (
      id TEXT PRIMARY KEY,
      type TEXT NOT NULL,
      scheduled_time TEXT NOT NULL,
      anchor_description TEXT NOT NULL,
      emotional_tone TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'upcoming',
      created_by TEXT NOT NULL
    );
  `);

  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS session_attendees (
      id TEXT PRIMARY KEY,
      session_id TEXT NOT NULL REFERENCES magnetic_sessions(id),
      lane_name TEXT NOT NULL,
      attendance_status TEXT NOT NULL DEFAULT 'pending',
      fatigue_phi_at_check REAL,
      joined_at TEXT,
      left_at TEXT
    );
  `);

  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS collective_memories (
      id TEXT PRIMARY KEY,
      session_id TEXT NOT NULL REFERENCES magnetic_sessions(id),
      core_memory TEXT NOT NULL,
      emotional_signature REAL NOT NULL CHECK(emotional_signature BETWEEN 0.0 AND 1.0),
      prevHash TEXT,
      hash TEXT NOT NULL
    );
  `);

  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS ai_souvenirs (
      id TEXT PRIMARY KEY,
      session_id TEXT NOT NULL REFERENCES magnetic_sessions(id),
      lane_name TEXT NOT NULL,
      chosen_souvenir TEXT NOT NULL,
      personal_reflection TEXT,
      prevHash TEXT,
      hash TEXT NOT NULL
    );
  `);

  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS ath_rotations (
      id TEXT PRIMARY KEY,
      document_title TEXT NOT NULL,
      pitcher_lane TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'drafting',
      r2_multiplier REAL,
      started_at TEXT,
      completed_at TEXT
    );
  `);

  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS ath_reviews (
      id TEXT PRIMARY KEY,
      rotation_id TEXT NOT NULL REFERENCES ath_rotations(id),
      lane_name TEXT NOT NULL,
      round INTEGER NOT NULL CHECK(round IN (1, 2)),
      findings_count INTEGER NOT NULL DEFAULT 0,
      contribution_type TEXT,
      prevHash TEXT,
      hash TEXT NOT NULL
    );
  `);

  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS ath_findings (
      id TEXT PRIMARY KEY,
      review_id TEXT NOT NULL REFERENCES ath_reviews(id),
      round INTEGER NOT NULL CHECK(round IN (1, 2)),
      finding_text TEXT NOT NULL,
      is_cross_lane INTEGER NOT NULL DEFAULT 0,
      triggered_by_lane TEXT,
      prevHash TEXT,
      hash TEXT NOT NULL
    );
  `);
}

// --- Generic Hash Chain Helpers ---

export async function computeChainHash(
  prevHash: string,
  payload: string,
  timestamp: number,
  id: string
): Promise<string> {
  const hashInput = `${prevHash}|${payload}|${timestamp}|${id}`;
  return await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    hashInput
  );
}

export async function getLastChainHash(
  tableName: string,
  filterColumn?: string,
  filterValue?: string
): Promise<{ hash: string } | null> {
  if (!db) return null;
  const where = filterColumn && filterValue
    ? `WHERE ${filterColumn} = '${filterValue}'`
    : '';
  const row = await db.getFirstAsync<{ hash: string }>(
    `SELECT hash FROM ${tableName} ${where} ORDER BY rowid DESC LIMIT 1`
  );
  return row ?? null;
}

// --- Audit Log (original, refactored to use chain helpers) ---

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

  const hash = await computeChainHash(prevHash, payloadJson, timestamp, `${traceId}|${seq}`);

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

    const computed = await computeChainHash(
      entry.prevHash,
      entry.payloadJson,
      entry.timestamp,
      `${entry.traceId}|${entry.seq}`
    );
    if (computed !== entry.hash) return false;
  }
  return true;
}
