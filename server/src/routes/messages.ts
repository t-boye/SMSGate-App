import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { requireApiKey, requireDevice } from '../middleware/auth';
import { pool, messageDb, deviceDb, userDb } from '../database';
import { SendMessageBody, UpdateMessageBody, PLANS } from '../types';

const router = Router();

// ─── POST /api/v1/messages ─────────────────────────────────────────────────────
router.post('/', requireApiKey, async (req: Request, res: Response) => {
  const body = req.body as SendMessageBody;

  if (!body.message || !Array.isArray(body.phoneNumbers) || body.phoneNumbers.length === 0) {
    res.status(400).json({ error: 'Fields required: message (string), phoneNumbers (array)' });
    return;
  }

  // Enforce SMS quota if request is tied to a user
  const user = req.user;
  if (user) {
    const plan = PLANS[user.plan];
    if (plan.smsLimit !== -1) {
      // Reset counter if month has rolled over
      const fresh = await userDb.getById(user.id);
      if (fresh) {
        const resetNeeded = new Date(fresh.sms_reset_at) <= new Date();
        const used = resetNeeded ? 0 : fresh.sms_used_month;
        const needed = body.phoneNumbers.length;
        if (used + needed > plan.smsLimit) {
          res.status(429).json({
            error: 'Monthly SMS limit reached',
            plan: user.plan,
            limit: plan.smsLimit,
            used,
            upgrade: '/api/v1/paystack/plans',
          });
          return;
        }
      }
    }
  }

  const messageId = body.id ?? uuidv4();
  await messageDb.insert({
    id: messageId,
    userId: user?.id ?? null,
    deviceId: body.deviceId ?? null,
    phoneNumbers: body.phoneNumbers,
    message: body.message,
    simNumber: body.simNumber,
    isEncrypted: body.isEncrypted,
  });

  // Increment usage counter
  if (user) {
    await userDb.incrementSmsUsed(user.id, body.phoneNumbers.length);
  }

  res.status(202).json({ id: messageId, status: 'queued' });
});

// ─── GET /api/v1/messages/pending ─────────────────────────────────────────────
router.get('/pending', requireDevice, async (req: Request, res: Response) => {
  const device = req.device!;

  const { rows } = await pool.query<{
    id: string; phone_numbers: string; message: string; sim_number: number | null; is_encrypted: boolean;
  }>(
    `WITH claimed AS (
       SELECT id FROM messages
       WHERE (
         (state = 'Pending' AND (device_id IS NULL OR device_id = $1))
         OR
         (state = 'Processed' AND device_id = $1 AND updated_at < NOW() - INTERVAL '5 minutes')
       )
       ORDER BY created_at ASC
       LIMIT 10
       FOR UPDATE SKIP LOCKED
     )
     UPDATE messages m
     SET state = 'Processed', device_id = $1, updated_at = NOW()
     FROM claimed
     WHERE m.id = claimed.id
     RETURNING m.id, m.phone_numbers, m.message, m.sim_number, m.is_encrypted`,
    [device.id],
  );

  await deviceDb.touchDeviceSeen(device.id).catch(() => {});

  const jobs = rows.map(r => ({
    id: r.id,
    type: 'send' as const,
    phoneNumbers: typeof r.phone_numbers === 'string' ? JSON.parse(r.phone_numbers) : r.phone_numbers,
    message: r.message,
    simNumber: r.sim_number ?? undefined,
    isEncrypted: r.is_encrypted === true || (r.is_encrypted as any) === 't',
  }));

  res.json(jobs);
});

// ─── GET /api/v1/messages ──────────────────────────────────────────────────────
router.get('/', requireApiKey, async (req: Request, res: Response) => {
  const limit  = Math.min(Number(req.query.limit) || 50, 200);
  const offset = Number(req.query.offset) || 0;
  const messages = await messageDb.list(req.user?.id, limit, offset);
  res.json(messages);
});

// ─── GET /api/v1/messages/:id ──────────────────────────────────────────────────
router.get('/:id', requireApiKey, async (req: Request, res: Response) => {
  const msg = await messageDb.get(req.params.id, req.user?.id);
  if (!msg) { res.status(404).json({ error: 'Not found' }); return; }
  res.json(msg);
});

// ─── PATCH /api/v1/messages/:id ───────────────────────────────────────────────
router.patch('/:id', requireDevice, async (req: Request, res: Response) => {
  const { state, recipients } = req.body as UpdateMessageBody;
  if (!state) { res.status(400).json({ error: 'state is required' }); return; }

  const msg = await messageDb.get(req.params.id);
  if (!msg) { res.status(404).json({ error: 'Not found' }); return; }

  await messageDb.updateState(req.params.id, state, recipients ?? []);
  res.json({ ok: true });
});

export default router;
