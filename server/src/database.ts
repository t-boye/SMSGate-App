import { Pool } from 'pg';
import { Message, MessageRecipient, MessageState, PlanName, UserRow } from './types';

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is required');
}

export const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// ─── User helpers ─────────────────────────────────────────────────────────────

export const userDb = {
  async create(params: {
    id: string; email: string; name: string; passwordHash: string;
  }): Promise<UserRow> {
    const { rows } = await pool.query(
      `INSERT INTO users (id, email, name, password_hash)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [params.id, params.email.toLowerCase(), params.name, params.passwordHash],
    );
    return rows[0];
  },

  async getByEmail(email: string): Promise<UserRow | null> {
    const { rows } = await pool.query(
      'SELECT * FROM users WHERE email = $1', [email.toLowerCase()],
    );
    return rows[0] ?? null;
  },

  async getById(id: string): Promise<UserRow | null> {
    const { rows } = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
    return rows[0] ?? null;
  },

  async setPlan(id: string, plan: PlanName, subscriptionCode: string | null, customerCode: string | null): Promise<void> {
    await pool.query(
      `UPDATE users SET plan = $1, paystack_subscription_code = $2, paystack_customer_code = $3 WHERE id = $4`,
      [plan, subscriptionCode, customerCode, id],
    );
  },

  // Reset SMS counter and set expiry 30 days from now
  async setSmsPlanExpiry(id: string): Promise<void> {
    await pool.query(
      `UPDATE users SET sms_used_month = 0, sms_reset_at = NOW() + INTERVAL '30 days' WHERE id = $1`,
      [id],
    );
  },

  // Increment SMS usage for the month; returns new count
  async incrementSmsUsed(userId: string, count: number): Promise<number> {
    // Reset counter if past the reset date
    await pool.query(
      `UPDATE users SET sms_used_month = 0, sms_reset_at = (date_trunc('month', NOW()) + INTERVAL '1 month')
       WHERE id = $1 AND sms_reset_at <= NOW()`,
      [userId],
    );
    const { rows } = await pool.query(
      `UPDATE users SET sms_used_month = sms_used_month + $1 WHERE id = $2 RETURNING sms_used_month`,
      [count, userId],
    );
    return rows[0]?.sms_used_month ?? 0;
  },
};

// ─── Message helpers ──────────────────────────────────────────────────────────

export const messageDb = {
  async insert(params: {
    id: string; userId: string | null; deviceId: string | null;
    phoneNumbers: string[]; message: string; simNumber?: number; isEncrypted?: boolean;
  }): Promise<void> {
    await pool.query(
      `INSERT INTO messages (id, user_id, device_id, phone_numbers, message, sim_number, is_encrypted)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        params.id, params.userId ?? null, params.deviceId ?? null,
        JSON.stringify(params.phoneNumbers), params.message,
        params.simNumber ?? null, params.isEncrypted ?? false,
      ],
    );
  },

  async get(id: string, userId?: string): Promise<Message | null> {
    const { rows } = await pool.query(
      userId
        ? 'SELECT * FROM messages WHERE id = $1 AND user_id = $2'
        : 'SELECT * FROM messages WHERE id = $1',
      userId ? [id, userId] : [id],
    );
    return rows[0] ? rowToMessage(rows[0]) : null;
  },

  async list(userId?: string, limit = 50, offset = 0): Promise<Message[]> {
    const { rows } = await pool.query(
      userId
        ? 'SELECT * FROM messages WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3'
        : 'SELECT * FROM messages ORDER BY created_at DESC LIMIT $1 OFFSET $2',
      userId ? [userId, limit, offset] : [limit, offset],
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

  async list(userId?: string) {
    const { rows } = await pool.query(
      userId
        ? 'SELECT * FROM devices WHERE user_id = $1 ORDER BY created_at DESC'
        : 'SELECT * FROM devices ORDER BY created_at DESC',
      userId ? [userId] : [],
    );
    return rows;
  },

  async create(params: { id: string; userId: string | null; name: string; login: string; passwordHash: string; token: string }) {
    await pool.query(
      `INSERT INTO devices (id, user_id, name, login, password_hash, token) VALUES ($1, $2, $3, $4, $5, $6)`,
      [params.id, params.userId, params.name, params.login, params.passwordHash, params.token],
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

  async list(userId?: string) {
    const { rows } = await pool.query(
      userId
        ? 'SELECT * FROM api_keys WHERE user_id = $1 ORDER BY created_at DESC'
        : 'SELECT * FROM api_keys ORDER BY created_at DESC',
      userId ? [userId] : [],
    );
    return rows;
  },

  async create(key: string, name: string, userId: string | null) {
    await pool.query('INSERT INTO api_keys (key, user_id, name) VALUES ($1, $2, $3)', [key, userId, name]);
  },

  async delete(key: string) {
    await pool.query('DELETE FROM api_keys WHERE key = $1', [key]);
  },
};

// ─── Row mapper ───────────────────────────────────────────────────────────────

function rowToMessage(row: Record<string, any>): Message {
  return {
    id: row.id,
    userId: row.user_id ?? null,
    deviceId: row.device_id,
    phoneNumbers: typeof row.phone_numbers === 'string' ? JSON.parse(row.phone_numbers) : row.phone_numbers,
    message: row.message,
    state: row.state,
    recipients: typeof row.recipients === 'string' ? JSON.parse(row.recipients) : (row.recipients ?? []),
    simNumber: row.sim_number ?? undefined,
    isEncrypted: row.is_encrypted === true || row.is_encrypted === 't',
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
