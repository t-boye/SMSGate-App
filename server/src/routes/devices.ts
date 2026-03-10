import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcrypt';
import { requireAdmin } from '../middleware/auth';
import { deviceDb, apiKeyDb } from '../database';
import { CreateDeviceBody, CreateApiKeyBody } from '../types';

const router = Router();

// ─── Devices ───────────────────────────────────────────────────────────────────

// GET /api/v1/devices  — list all devices with online status
router.get('/devices', requireAdmin, async (_req: Request, res: Response) => {
  const devices = await deviceDb.list();
  const result = devices.map((d: any) => ({
    id: d.id,
    name: d.name,
    login: d.login,
    token: d.token,
    createdAt: d.created_at,
    lastSeenAt: d.last_seen_at,
  }));
  res.json(result);
});

// POST /api/v1/devices  — create a new device
router.post('/devices', requireAdmin, async (req: Request, res: Response) => {
  const { name, login, password } = req.body as CreateDeviceBody;
  if (!name || !login || !password) {
    res.status(400).json({ error: 'name, login, and password are required' });
    return;
  }

  const id = uuidv4();
  const passwordHash = await bcrypt.hash(password, 10);
  const token = uuidv4().replace(/-/g, ''); // 32-char bearer token

  await deviceDb.create({ id, name, login, passwordHash, token });

  res.status(201).json({ id, name, login, token });
});

// DELETE /api/v1/devices/:id
router.delete('/devices/:id', requireAdmin, async (req: Request, res: Response) => {
  await deviceDb.delete(req.params.id);
  res.json({ ok: true });
});

// ─── API Keys ─────────────────────────────────────────────────────────────────

// GET /api/v1/keys
router.get('/keys', requireAdmin, async (_req: Request, res: Response) => {
  const keys = await apiKeyDb.list();
  res.json(keys);
});

// POST /api/v1/keys  — create a new API key
router.post('/keys', requireAdmin, async (req: Request, res: Response) => {
  const { name } = req.body as CreateApiKeyBody;
  if (!name) {
    res.status(400).json({ error: 'name is required' });
    return;
  }
  const key = uuidv4().replace(/-/g, '');
  await apiKeyDb.create(key, name);
  res.status(201).json({ key, name });
});

// DELETE /api/v1/keys/:key
router.delete('/keys/:key', requireAdmin, async (req: Request, res: Response) => {
  await apiKeyDb.delete(req.params.key);
  res.json({ ok: true });
});

export default router;
