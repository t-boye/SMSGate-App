import 'dotenv/config';
import { pool } from './database';

async function migrate() {
  console.log('Running migrations…');

  // ── Users (tenant accounts) ──────────────────────────────────────────────────
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id                         TEXT PRIMARY KEY,
      email                      TEXT NOT NULL UNIQUE,
      name                       TEXT NOT NULL,
      password_hash              TEXT NOT NULL,
      plan                       TEXT NOT NULL DEFAULT 'free',
      sms_used_month             INTEGER NOT NULL DEFAULT 0,
      sms_reset_at               TIMESTAMPTZ NOT NULL DEFAULT (date_trunc('month', NOW()) + INTERVAL '1 month'),
      paystack_customer_code     TEXT,
      paystack_subscription_code TEXT,
      created_at                 TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_token         TEXT;
    ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_token_expires TIMESTAMPTZ;
    ALTER TABLE users ADD COLUMN IF NOT EXISTS plan_expires_at     TIMESTAMPTZ;
  `);

  // ── Devices ──────────────────────────────────────────────────────────────────
  await pool.query(`
    CREATE TABLE IF NOT EXISTS devices (
      id             TEXT PRIMARY KEY,
      user_id        TEXT REFERENCES users(id) ON DELETE CASCADE,
      name           TEXT NOT NULL,
      login          TEXT NOT NULL UNIQUE,
      password_hash  TEXT NOT NULL,
      token          TEXT NOT NULL UNIQUE,
      created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      last_seen_at   TIMESTAMPTZ
    );

    ALTER TABLE devices ADD COLUMN IF NOT EXISTS user_id TEXT REFERENCES users(id) ON DELETE CASCADE;
    ALTER TABLE devices ADD COLUMN IF NOT EXISTS sims JSONB;
  `);

  // ── API Keys ─────────────────────────────────────────────────────────────────
  await pool.query(`
    CREATE TABLE IF NOT EXISTS api_keys (
      key        TEXT PRIMARY KEY,
      user_id    TEXT REFERENCES users(id) ON DELETE CASCADE,
      name       TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    ALTER TABLE api_keys ADD COLUMN IF NOT EXISTS user_id TEXT REFERENCES users(id) ON DELETE CASCADE;
  `);

  // ── Messages ─────────────────────────────────────────────────────────────────
  await pool.query(`
    CREATE TABLE IF NOT EXISTS messages (
      id            TEXT PRIMARY KEY,
      user_id       TEXT REFERENCES users(id) ON DELETE SET NULL,
      device_id     TEXT REFERENCES devices(id) ON DELETE SET NULL,
      phone_numbers TEXT NOT NULL,
      message       TEXT NOT NULL,
      state         TEXT NOT NULL DEFAULT 'Pending',
      recipients    TEXT NOT NULL DEFAULT '[]',
      sim_number    INTEGER,
      is_encrypted  BOOLEAN NOT NULL DEFAULT FALSE,
      created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    ALTER TABLE messages ADD COLUMN IF NOT EXISTS user_id TEXT REFERENCES users(id) ON DELETE SET NULL;

    CREATE INDEX IF NOT EXISTS idx_messages_state      ON messages(state);
    CREATE INDEX IF NOT EXISTS idx_messages_device_id  ON messages(device_id);
    CREATE INDEX IF NOT EXISTS idx_messages_user_id    ON messages(user_id);
    CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_devices_user_id     ON devices(user_id);
    CREATE INDEX IF NOT EXISTS idx_api_keys_user_id    ON api_keys(user_id);
  `);

  console.log('Migrations complete.');
  await pool.end();
}

migrate().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
