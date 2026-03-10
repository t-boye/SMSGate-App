import { Pool } from 'pg';
import { Message, MessageRecipient, MessageState } from './types';

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is required');
}

export const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// ─── Message helpers ──────────────────────────────────────────────────────────

export const messageDb = {
  async insert(params: {
    id: string;
    deviceId: string | null;
    phoneNumbers: string[];
    message: string;
    simNumber?: number;
    isEncrypted?: boolean;
  }): Promise<void> {
    await pool.query(
      `INSERT INTO messages (id, device_id, phone_numbers, message, sim_number, is_encrypted)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        params.id,
        params.deviceId ?? null,
        JSON.stringify(params.phoneNumbers),
        params.message,
        params.simNumber ?? null,
        params.isEncrypted ?? false,
      ],
    );
  },

  async get(id: string): Promise<Message | null> {
    const { rows } = await pool.query('SELECT * FROM messages WHERE id = $1', [id]);
    return rows[0] ? rowToMessage(rows[0]) : null;
  },

  async list(limit = 50, offset = 0): Promise<Message[]> {
    const { rows } = await pool.query(
      'SELECT * FROM messages ORDER BY created_at DESC LIMIT $1 OFFSET $2',
      [limit, offset],
    );
    return rows.map(rowToMessage);
  },

  async updateState(id: string, state: MessageState, recipients: MessageRecipient[]): Promise<void> {
    await pool.query(
      `UPDATE messages SET state = $1, recipients = $2, updated_at = NOW() WHERE id = $3`,
      [state, JSON.stringify(recipients), id],
    );
  },

  async touchDeviceSeen(deviceId: string): Promise<void> {
    await pool.query(`UPDATE devices SET last_seen_at = NOW() WHERE id = $1`, [deviceId]);
  },
};

// ─── Device helpers ───────────────────────────────────────────────────────────

export const deviceDb = {
  async getByLogin(login: string) {
    const { rows } = await pool.query('SELECT * FROM devices WHERE login = $1', [login]);
    return rows[0] ?? null;
  },

  async getByToken(token: string) {
    const { rows } = await pool.query('SELECT * FROM devices WHERE token = $1', [token]);
    return rows[0] ?? null;
  },

  async getById(id: string) {
    const { rows } = await pool.query('SELECT * FROM devices WHERE id = $1', [id]);
    return rows[0] ?? null;
  },

  async list() {
    const { rows } = await pool.query('SELECT * FROM devices ORDER BY created_at DESC');
    return rows;
  },

  async create(params: { id: string; name: string; login: string; passwordHash: string; token: string }) {
    await pool.query(
      `INSERT INTO devices (id, name, login, password_hash, token)
       VALUES ($1, $2, $3, $4, $5)`,
      [params.id, params.name, params.login, params.passwordHash, params.token],
    );
  },

  async delete(id: string) {
    await pool.query('DELETE FROM devices WHERE id = $1', [id]);
  },
};

// ─── API Key helpers ──────────────────────────────────────────────────────────

export const apiKeyDb = {
  async get(key: string) {
    const { rows } = await pool.query('SELECT * FROM api_keys WHERE key = $1', [key]);
    return rows[0] ?? null;
  },

  async list() {
    const { rows } = await pool.query('SELECT * FROM api_keys ORDER BY created_at DESC');
    return rows;
  },

  async create(key: string, name: string) {
    await pool.query('INSERT INTO api_keys (key, name) VALUES ($1, $2)', [key, name]);
  },

  async delete(key: string) {
    await pool.query('DELETE FROM api_keys WHERE key = $1', [key]);
  },
};

// ─── Row mapper ───────────────────────────────────────────────────────────────

function rowToMessage(row: Record<string, any>): Message {
  return {
    id: row.id,
    deviceId: row.device_id,
    phoneNumbers: typeof row.phone_numbers === 'string'
      ? JSON.parse(row.phone_numbers)
      : row.phone_numbers,
    message: row.message,
    state: row.state,
    recipients: typeof row.recipients === 'string'
      ? JSON.parse(row.recipients)
      : (row.recipients ?? []),
    simNumber: row.sim_number ?? undefined,
    isEncrypted: row.is_encrypted === true || row.is_encrypted === 't',
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
