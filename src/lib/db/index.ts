import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import fs from "fs";
import path from "path";
import * as schema from "./schema";

const dataDir = path.join(process.cwd(), "data");
const dbPath = path.join(dataDir, "onelastthing.sqlite");

let _db: ReturnType<typeof drizzle<typeof schema>> | null = null;

function ensureSchema(sqlite: Database.Database) {
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS events (
      id TEXT PRIMARY KEY,
      source TEXT NOT NULL,
      action TEXT NOT NULL,
      entity_type TEXT,
      entity_id TEXT,
      summary TEXT NOT NULL,
      metadata TEXT,
      occurred_at TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS patterns (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT NOT NULL,
      sequence TEXT NOT NULL,
      frequency_per_week INTEGER NOT NULL,
      estimated_minutes_per_week REAL NOT NULL,
      confidence REAL NOT NULL,
      status TEXT NOT NULL DEFAULT 'detected',
      created_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS workflows (
      id TEXT PRIMARY KEY,
      pattern_id TEXT,
      name TEXT NOT NULL,
      description TEXT NOT NULL,
      spec TEXT NOT NULL,
      risk_report TEXT,
      status TEXT NOT NULL DEFAULT 'draft',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS runs (
      id TEXT PRIMARY KEY,
      workflow_id TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'queued',
      log TEXT NOT NULL DEFAULT '[]',
      minutes_saved REAL DEFAULT 0,
      started_at TEXT,
      finished_at TEXT,
      created_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS insights (
      id TEXT PRIMARY KEY,
      kind TEXT NOT NULL,
      title TEXT NOT NULL,
      body TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
  `);
}

export function getDb() {
  if (_db) return _db;
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
  const sqlite = new Database(dbPath);
  sqlite.pragma("journal_mode = WAL");
  ensureSchema(sqlite);
  _db = drizzle(sqlite, { schema });
  return _db;
}

export { schema };
