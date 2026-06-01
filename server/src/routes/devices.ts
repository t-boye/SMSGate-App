import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcrypt';
import { requireAdmin, requireUser } from '../middleware/auth';
import { deviceDb, apiKeyDb } from '../database';
import { CreateDeviceBody, CreateApiKeyBody } from '../types';

const router = Router();

// ─── Devices (user-scoped) ────────────────────────────────────────────────────

// GET /api/v1/devices — user sees their own devices; admin sees all
router.get('/devices', requireUser, async (req: Request, res: Response) => {
  const devices = await deviceDb.list(req.user!.id);
  res.json(devices.map((d: any) => ({
    id: d.id,
    name: d.name,
    login: d.login,
    token: d.token,
    createdAt: d.created_at,
    lastSeenAt: d.last_seen_at,
    isOnline: d.last_seen_at ? (Date.now() - new Date(d.last_seen_at).getTime()) < 30_000 : false,
  })));
});

// POST /api/v1/devices — user registers a device under their account
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

  const id = uuidv4();
  const passwordHash = await bcrypt.hash(password, 10);
  const token = uuidv4().replace(/-/g, '');

  await deviceDb.create({ id, userId: req.user!.id, name, login, passwordHash, token });
  res.status(201).json({ id, name, login, token });
});

// DELETE /api/v1/devices/:id — user can only delete their own device
router.delete('/devices/:id', requireUser, async (req: Request, res: Response) => {
  const device = await deviceDb.getById(req.params.id);
  if (!device) { res.status(404).json({ error: 'Not found' }); return; }
  if (device.user_id !== req.user!.id) { res.status(403).json({ error: 'Forbidden' }); return; }
  await deviceDb.delete(req.params.id);
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
  const key = uuidv4().replace(/-/g, '');
  await apiKeyDb.create(key, name, req.user!.id);
  res.status(201).json({ key, name });
});

// DELETE /api/v1/keys/:key — user can only delete their own keys
router.delete('/keys/:key', requireUser, async (req: Request, res: Response) => {
  const existing = await apiKeyDb.get(req.params.key);
  if (!existing) { res.status(404).json({ error: 'Not found' }); return; }
  if (existing.user_id !== req.user!.id) { res.status(403).json({ error: 'Forbidden' }); return; }
  await apiKeyDb.delete(req.params.key);
  res.json({ ok: true });
});

// ─── Admin-only routes (full access) ─────────────────────────────────────────

router.get('/admin/devices', requireAdmin, async (_req: Request, res: Response) => {
  const devices = await deviceDb.list();
  res.json(devices);
});

router.delete('/admin/devices/:id', requireAdmin, async (req: Request, res: Response) => {
  await deviceDb.delete(req.params.id);
  res.json({ ok: true });
});

router.get('/admin/keys', requireAdmin, async (_req: Request, res: Response) => {
  res.json(await apiKeyDb.list());
});

export default router;
