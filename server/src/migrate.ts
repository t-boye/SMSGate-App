/**
 * Run this once to create all tables in your Neon (Postgres) database.
 * Usage: npm run db:migrate
 */
import 'dotenv/config';
import { pool } from './database';

async function migrate() {
  console.log('Running migrations…');

  await pool.query(`
    CREATE TABLE IF NOT EXISTS devices (
      id             TEXT PRIMARY KEY,
      name           TEXT NOT NULL,
      login          TEXT NOT NULL UNIQUE,
      password_hash  TEXT NOT NULL,
      token          TEXT NOT NULL UNIQUE,
      created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      last_seen_at   TIMESTAMPTZ
    );

    CREATE TABLE IF NOT EXISTS api_keys (
      key        TEXT PRIMARY KEY,
      name       TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS messages (
      id           TEXT PRIMARY KEY,
      device_id    TEXT REFERENCES devices(id) ON DELETE SET NULL,
      phone_numbers TEXT NOT NULL,
      message      TEXT NOT NULL,
      state        TEXT NOT NULL DEFAULT 'Pending',
      recipients   TEXT NOT NULL DEFAULT '[]',
      sim_number   INTEGER,
      is_encrypted BOOLEAN NOT NULL DEFAULT FALSE,
      created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS idx_messages_state      ON messages(state);
    CREATE INDEX IF NOT EXISTS idx_messages_device_id  ON messages(device_id);
    CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at DESC);
  `);

  console.log('Migrations complete.');
  await pool.end();
}

migrate().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
