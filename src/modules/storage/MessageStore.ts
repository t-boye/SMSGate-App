import {open} from '@op-engineering/op-sqlite';
import {Message, MessageState, MessageRecipient} from '../../types';

type DB = ReturnType<typeof open>;

// op-sqlite v9 execute() is synchronous at runtime but typed as Promise — cast to fix TS
function exec(db: DB, sql: string, params?: any[]): {rows?: any[]} {
  return (db as any).execute(sql, params) as {rows?: any[]};
}

const DB_NAME = 'smsgateway.db';

class MessageStore {
  private db: DB | null = null;

  private ensureDb(): DB {
    if (!this.db) {
      throw new Error('[MessageStore] Not initialized — call initialize() first');
    }
    return this.db;
  }

  initialize(): void {
    try {
      this.db = open({name: DB_NAME});
      const db = this.db;

      exec(db, `
        CREATE TABLE IF NOT EXISTS messages (
          id          TEXT PRIMARY KEY,
          body        TEXT NOT NULL,
          state       TEXT NOT NULL DEFAULT 'Pending',
          sim_number  INTEGER DEFAULT 1,
          is_encrypted INTEGER DEFAULT 0,
          created_at  INTEGER NOT NULL,
          updated_at  INTEGER NOT NULL,
          source      TEXT DEFAULT 'local'
        )
      `);
      exec(db, `
        CREATE TABLE IF NOT EXISTS recipients (
          id           TEXT PRIMARY KEY,
          message_id   TEXT NOT NULL,
          phone        TEXT NOT NULL,
          state        TEXT NOT NULL DEFAULT 'Pending',
          error        TEXT,
          sent_at      INTEGER,
          delivered_at INTEGER,
          FOREIGN KEY (message_id) REFERENCES messages(id) ON DELETE CASCADE
        )
      `);
      exec(db, `CREATE INDEX IF NOT EXISTS idx_messages_created ON messages(created_at DESC)`);
      exec(db, `CREATE INDEX IF NOT EXISTS idx_recipients_message ON recipients(message_id)`);
    } catch (e) {
      console.error('[MessageStore] Initialization failed:', e);
      throw e;
    }
  }

  insertMessage(msg: {
    id: string;
    body: string;
    state?: MessageState;
    simNumber?: number;
    isEncrypted?: boolean;
    source?: 'local' | 'cloud' | 'http';
  }): void {
    const now = Date.now();
    const db = this.ensureDb();
    exec(db,
      `INSERT OR REPLACE INTO messages (id, body, state, sim_number, is_encrypted, created_at, updated_at, source)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [msg.id, msg.body, msg.state ?? 'Pending', msg.simNumber ?? 1,
       msg.isEncrypted ? 1 : 0, now, now, msg.source ?? 'local'],
    );
  }

  insertRecipient(r: {id: string; messageId: string; phone: string; state?: MessageState}): void {
    const db = this.ensureDb();
    exec(db,
      `INSERT OR REPLACE INTO recipients (id, message_id, phone, state) VALUES (?, ?, ?, ?)`,
      [r.id, r.messageId, r.phone, r.state ?? 'Pending'],
    );
  }

  updateRecipientState(recipientId: string, state: MessageState, error?: string): void {
    const db = this.ensureDb();
    const now = Date.now();
    if (state === 'Sent') {
      exec(db, `UPDATE recipients SET state=?, error=?, sent_at=? WHERE id=?`,
        [state, error ?? null, now, recipientId]);
    } else if (state === 'Delivered') {
      exec(db, `UPDATE recipients SET state=?, delivered_at=? WHERE id=?`,
        [state, now, recipientId]);
    } else {
      exec(db, `UPDATE recipients SET state=?, error=? WHERE id=?`,
        [state, error ?? null, recipientId]);
    }
    const result = exec(db, `SELECT message_id FROM recipients WHERE id=?`, [recipientId]);
    const messageId = result.rows?.[0]?.message_id as string | undefined;
    if (messageId) this.recomputeMessageState(messageId);
  }

  recomputeMessageState(messageId: string): void {
    const db = this.ensureDb();
    const result = exec(db, `SELECT state FROM recipients WHERE message_id=?`, [messageId]);
    const states = (result.rows ?? []).map((r: any) => r.state as MessageState);
    let overall: MessageState = 'Pending';
    if (states.length > 0) {
      if (states.every((s: string) => s === 'Delivered')) overall = 'Delivered';
      else if (states.every((s: string) => s === 'Failed')) overall = 'Failed';
      else if (states.some((s: string) => s === 'Delivered' || s === 'Sent')) overall = 'Sent';
      else if (states.some((s: string) => s === 'Failed')) overall = 'Failed';
    }
    exec(db, `UPDATE messages SET state=?, updated_at=? WHERE id=?`,
      [overall, Date.now(), messageId]);
  }

  getMessage(id: string): Message | null {
    const db = this.ensureDb();
    const msgResult = exec(db, `SELECT * FROM messages WHERE id=?`, [id]);
    const row = msgResult.rows?.[0];
    if (!row) return null;

    const recResult = exec(db,
      `SELECT * FROM recipients WHERE message_id=? ORDER BY rowid`, [id]);
    const recipients: MessageRecipient[] = (recResult.rows ?? []).map((r: any) => ({
      id: r.id,
      phoneNumber: r.phone,
      state: r.state as MessageState,
      error: r.error ?? undefined,
      sentAt: r.sent_at ?? undefined,
      deliveredAt: r.delivered_at ?? undefined,
    }));

    return {
      id: row.id as string,
      message: row.body as string,
      phoneNumbers: recipients.map(rec => rec.phoneNumber),
      recipients,
      state: row.state as MessageState,
      createdAt: new Date(Number(row.created_at)).toISOString(),
      isEncrypted: row.is_encrypted === 1,
      simNumber: row.sim_number ?? undefined,
      source: row.source ?? undefined,
    };
  }

  listMessages(limit: number = 50, offset: number = 0): Message[] {
    const db = this.ensureDb();
    const result = exec(db,
      `SELECT id FROM messages ORDER BY created_at DESC LIMIT ? OFFSET ?`, [limit, offset]);
    return (result.rows ?? [])
      .map((r: any) => this.getMessage(r.id as string))
      .filter(Boolean) as Message[];
  }

  getStats() {
    const db = this.ensureDb();
    const result = exec(db, `SELECT state, COUNT(*) as cnt FROM messages GROUP BY state`);
    const stats = {pending: 0, processed: 0, sent: 0, delivered: 0, failed: 0};
    for (const row of result.rows ?? []) {
      const state = String((row as any).state ?? '').toLowerCase();
      const cnt = Number((row as any).cnt ?? 0);
      if (state in stats) (stats as any)[state] = cnt;
    }
    return stats;
  }
}

export const messageStore = new MessageStore();
