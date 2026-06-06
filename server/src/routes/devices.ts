import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcrypt';
import { requireAdmin, requireUser, requireDevice, requireApiKey } from '../middleware/auth';
import { deviceDb, apiKeyDb } from '../database';
import { CreateDeviceBody, CreateApiKeyBody, PLANS } from '../types';

const router = Router();

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatDevice(d: any) {
  const sims = d.sims
    ? (typeof d.sims === 'string' ? JSON.parse(d.sims) : d.sims)
    : [];
  return {
    id:          d.id,
    name:        d.name,
    login:       d.login,
    token:       d.token,
    sims,
    createdAt:   d.created_at,
    lastSeenAt:  d.last_seen_at,
    isOnline:    d.last_seen_at
      ? (Date.now() - new Date(d.last_seen_at).getTime()) < 30_000
      : false,
  };
}

// ─── Devices (user-scoped) ────────────────────────────────────────────────────

// GET /api/v1/devices — works with both user JWT and API key
router.get('/devices', async (req: Request, res: Response) => {
  // Try user JWT first, then API key
  const authHeader = req.headers['authorization'] ?? '';
  if (!authHeader) { res.status(401).json({ error: 'Authentication required' }); return; }

  let userId: string | null = null;

  if (authHeader.startsWith('Bearer ')) {
    const token = authHeader.slice(7);
    // Try API key first (32-char hex), then JWT
    const key = await apiKeyDb.get(token);
    if (key?.user_id) {
      userId = key.user_id;
    } else {
      // Fall through to user JWT check via requireUser — replicate inline
      try {
        const jwt = require('jsonwebtoken');
        const secret = process.env.JWT_SECRET;
        if (secret) {
          const payload = jwt.verify(token, secret) as { sub: string };
          userId = payload.sub;
        }
      } catch {}
    }
  }

  if (!userId) { res.status(401).json({ error: 'Invalid credentials' }); return; }

  const devices = await deviceDb.list(userId);
  res.json(devices.map(formatDevice));
});

// POST /api/v1/devices
router.post('/devices', requireUser, async (req: Request, res: Response) => {
  const { name, login, password } = req.body as CreateDeviceBody;
  if (!name || !login || !password) {
    res.status(400).json({ error: 'name, login, and password are required' });
    return;
  }
  if (password.length < 6) {
    res.status(400).json({ error: 'Password must be at least 6 characters' });
    return;
  }

  const plan = PLANS[req.user!.plan];
  if (plan.deviceLimit !== -1) {
    const existing = await deviceDb.list(req.user!.id);
    if (existing.length >= plan.deviceLimit) {
      res.status(403).json({
        error: `Device limit reached for ${plan.name} plan (max ${plan.deviceLimit})`,
        upgrade: '/api/v1/paystack/plans',
      });
      return;
    }
  }

  const id           = uuidv4();
  const passwordHash = await bcrypt.hash(password, 10);
  const token        = uuidv4().replace(/-/g, '');

  await deviceDb.create({ id, userId: req.user!.id, name, login, passwordHash, token });
  res.status(201).json({ id, name, login, token });
});

// DELETE /api/v1/devices/:id
router.delete('/devices/:id', requireUser, async (req: Request, res: Response) => {
  const device = await deviceDb.getById(req.params.id);
  if (!device) { res.status(404).json({ error: 'Not found' }); return; }
  if (device.user_id !== req.user!.id) { res.status(403).json({ error: 'Forbidden' }); return; }
  await deviceDb.delete(req.params.id);
  res.json({ ok: true });
});

// ─── Device heartbeat — Android app reports SIM cards ────────────────────────

// POST /api/v1/devices/heartbeat
router.post('/devices/heartbeat', requireDevice, async (req: Request, res: Response) => {
  const { sims } = req.body as { sims?: any[] };
  if (Array.isArray(sims) && sims.length > 0) {
    await deviceDb.updateSims(req.device!.id, sims);
  } else {
    await deviceDb.touchDeviceSeen(req.device!.id);
  }
  res.json({ ok: true });
});

// ─── API Keys (user-scoped) ───────────────────────────────────────────────────

// GET /api/v1/keys
router.get('/keys', requireUser, async (req: Request, res: Response) => {
  const keys = await apiKeyDb.list(req.user!.id);
  res.json(keys.map((k: any) => ({ key: k.key, name: k.name, createdAt: k.created_at })));
});

// POST /api/v1/keys
router.post('/keys', requireUser, async (req: Request, res: Response) => {
  const { name } = req.body as CreateApiKeyBody;
  if (!name) { res.status(400).json({ error: 'name is required' }); return; }

  const plan = PLANS[req.user!.plan];
  if (plan.keyLimit !== -1) {
    const existing = await apiKeyDb.list(req.user!.id);
    if (existing.length >= plan.keyLimit) {
      res.status(403).json({
        error: `API key limit reached for ${plan.name} plan (max ${plan.keyLimit})`,
        upgrade: '/api/v1/paystack/plans',
      });
      return;
    }
  }

  const key = uuidv4().replace(/-/g, '');
  await apiKeyDb.create(key, name, req.user!.id);
  res.status(201).json({ key, name, createdAt: new Date().toISOString() });
});

// DELETE /api/v1/keys/:key
router.delete('/keys/:key', requireUser, async (req: Request, res: Response) => {
  const existing = await apiKeyDb.get(req.params.key);
  if (!existing) { res.status(404).json({ error: 'Not found' }); return; }
  if (existing.user_id !== req.user!.id) { res.status(403).json({ error: 'Forbidden' }); return; }
  await apiKeyDb.delete(req.params.key);
  res.json({ ok: true });
});

// ─── Admin ────────────────────────────────────────────────────────────────────

router.get('/admin/devices', requireAdmin, async (_req, res) => res.json(await deviceDb.list()));
router.delete('/admin/devices/:id', requireAdmin, async (req, res) => {
  await deviceDb.delete(req.params.id); res.json({ ok: true });
});
router.get('/admin/keys', requireAdmin, async (_req, res) => res.json(await apiKeyDb.list()));

export default router;
