import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { requireApiKey, requireDevice } from '../middleware/auth';
import { pool, messageDb } from '../database';
import { SendMessageBody, UpdateMessageBody } from '../types';

const router = Router();

// ─── POST /api/v1/messages ─────────────────────────────────────────────────────
// Client submits an SMS job. Saved as Pending — the device picks it up on next poll.
router.post('/', requireApiKey, async (req: Request, res: Response) => {
  const body = req.body as SendMessageBody;

  if (!body.message || !Array.isArray(body.phoneNumbers) || body.phoneNumbers.length === 0) {
    res.status(400).json({
      error: 'Fields required: message (string), phoneNumbers (array)',
    });
    return;
  }

  const messageId = body.id ?? uuidv4();

  await messageDb.insert({
    id: messageId,
    deviceId: body.deviceId ?? null,
    phoneNumbers: body.phoneNumbers,
    message: body.message,
    simNumber: body.simNumber,
    isEncrypted: body.isEncrypted,
  });

  res.status(202).json({ id: messageId, status: 'queued' });
});

// ─── GET /api/v1/messages/pending ─────────────────────────────────────────────
// Called by the Android device every few seconds to claim and fetch pending jobs.
// Uses a CTE to atomically claim messages so two devices never process the same job.
router.get('/pending', requireDevice, async (req: Request, res: Response) => {
  const device = req.device!;

  // Atomically claim up to 10 pending messages assigned to this device (or unassigned)
  // and mark them as Processed so no other device picks them up.
  // Claim Pending messages OR Processed messages stuck for > 5 min (device crashed mid-send)
  const { rows } = await pool.query<{ id: string; phone_numbers: string; message: string; sim_number: number | null; is_encrypted: boolean }>(
    `WITH claimed AS (
       SELECT id FROM messages
       WHERE (
         (state = 'Pending' AND (device_id IS NULL OR device_id = $1))
         OR
         (state = 'Processed' AND device_id = $1 AND updated_at < NOW() - INTERVAL '5 minutes')
       )
       ORDER BY created_at ASC
       LIMIT  10
       FOR UPDATE SKIP LOCKED
     )
     UPDATE messages m
     SET    state = 'Processed', device_id = $1, updated_at = NOW()
     FROM   claimed
     WHERE  m.id = claimed.id
     RETURNING m.id, m.phone_numbers, m.message, m.sim_number, m.is_encrypted`,
    [device.id],
  );

  await messageDb.touchDeviceSeen(device.id).catch(() => {});

  const jobs = rows.map(r => ({
    id: r.id,
    type: 'send' as const,
    phoneNumbers: typeof r.phone_numbers === 'string'
      ? JSON.parse(r.phone_numbers)
      : r.phone_numbers,
    message: r.message,
    simNumber: r.sim_number ?? undefined,
    isEncrypted: r.is_encrypted === true || (r.is_encrypted as any) === 't',
  }));

  res.json(jobs);
});

// ─── GET /api/v1/messages ──────────────────────────────────────────────────────
router.get('/', requireApiKey, async (req: Request, res: Response) => {
  const limit  = Math.min(Number(req.query.limit)  || 50, 200);
  const offset = Number(req.query.offset) || 0;
  const messages = await messageDb.list(limit, offset);
  res.json(messages);
});

// ─── GET /api/v1/messages/:id ──────────────────────────────────────────────────
router.get('/:id', requireApiKey, async (req: Request, res: Response) => {
  const msg = await messageDb.get(req.params.id);
  if (!msg) { res.status(404).json({ error: 'Not found' }); return; }
  res.json(msg);
});

// ─── PATCH /api/v1/messages/:id ───────────────────────────────────────────────
// Device reports delivery status back after sending the SMS.
router.patch('/:id', requireDevice, async (req: Request, res: Response) => {
  const { state, recipients } = req.body as UpdateMessageBody;
  if (!state) { res.status(400).json({ error: 'state is required' }); return; }

  const msg = await messageDb.get(req.params.id);
  if (!msg) { res.status(404).json({ error: 'Not found' }); return; }

  await messageDb.updateState(req.params.id, state, recipients ?? []);
  res.json({ ok: true });
});

export default router;
