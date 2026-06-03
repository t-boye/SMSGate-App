import { Router, Request, Response } from 'express';
import bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { userDb, apiKeyDb, deviceDb } from '../database';
import { requireUser, signUserToken } from '../middleware/auth';
import { PLANS, RegisterUserBody, LoginUserBody } from '../types';

const router = Router();

// ─── POST /api/v1/users/register ──────────────────────────────────────────────
router.post('/register', async (req: Request, res: Response) => {
  const { email, name, password } = req.body as RegisterUserBody;

  if (!email || !name || !password) {
    res.status(400).json({ error: 'email, name and password are required' });
    return;
  }
  if (password.length < 6) {
    res.status(400).json({ error: 'Password must be at least 6 characters' });
    return;
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    res.status(400).json({ error: 'Invalid email address' });
    return;
  }

  const existing = await userDb.getByEmail(email);
  if (existing) {
    res.status(409).json({ error: 'Email already registered' });
    return;
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await userDb.create({ id: uuidv4(), email, name, passwordHash });
  const token = signUserToken(user.id);

  res.status(201).json({
    token,
    user: safeUser(user),
  });
});

// ─── POST /api/v1/users/login ─────────────────────────────────────────────────
router.post('/login', async (req: Request, res: Response) => {
  const { email, password } = req.body as LoginUserBody;
  if (!email || !password) {
    res.status(400).json({ error: 'email and password are required' });
    return;
  }

  const user = await userDb.getByEmail(email);
  if (!user) {
    res.status(401).json({ error: 'Invalid email or password' });
    return;
  }

  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) {
    res.status(401).json({ error: 'Invalid email or password' });
    return;
  }

  const token = signUserToken(user.id);
  res.json({ token, user: safeUser(user) });
});

// ─── GET /api/v1/users/me ─────────────────────────────────────────────────────
router.get('/me', requireUser, async (req: Request, res: Response) => {
  const user = req.user!;
  const plan = PLANS[user.plan];
  const [devices, keys] = await Promise.all([deviceDb.list(user.id), apiKeyDb.list(user.id)]);

  res.json({
    user: safeUser(user),
    plan: {
      name: plan.name,
      smsLimit: plan.smsLimit,
      smsUsed: user.sms_used_month,
      smsRemaining: plan.smsLimit === -1 ? null : Math.max(0, plan.smsLimit - user.sms_used_month),
      resetsAt: user.sms_reset_at,
      deviceLimit: plan.deviceLimit,
      keyLimit: plan.keyLimit,
    },
    deviceCount: devices.length,
    apiKeyCount: keys.length,
  });
});

// ─── PATCH /api/v1/users/me ───────────────────────────────────────────────────
router.patch('/me', requireUser, async (req: Request, res: Response) => {
  const { name } = req.body as { name?: string };
  if (!name || !name.trim()) {
    res.status(400).json({ error: 'name is required' });
    return;
  }
  await userDb.updateName(req.user!.id, name.trim());
  res.json({ ok: true });
});

// ─── POST /api/v1/users/me/password ──────────────────────────────────────────
router.post('/me/password', requireUser, async (req: Request, res: Response) => {
  const { currentPassword, newPassword } = req.body as { currentPassword?: string; newPassword?: string };
  if (!currentPassword || !newPassword) {
    res.status(400).json({ error: 'currentPassword and newPassword are required' });
    return;
  }
  if (newPassword.length < 6) {
    res.status(400).json({ error: 'New password must be at least 6 characters' });
    return;
  }

  const user = await userDb.getById(req.user!.id);
  const valid = user ? await bcrypt.compare(currentPassword, user.password_hash) : false;
  if (!valid) {
    res.status(401).json({ error: 'Current password is incorrect' });
    return;
  }

  const hash = await bcrypt.hash(newPassword, 10);
  await userDb.updatePassword(req.user!.id, hash);
  res.json({ ok: true });
});

// ─── GET /api/v1/users/me/usage ───────────────────────────────────────────────
router.get('/me/usage', requireUser, async (req: Request, res: Response) => {
  const user = req.user!;
  const plan = PLANS[user.plan];
  res.json({
    plan: user.plan,
    smsUsed: user.sms_used_month,
    smsLimit: plan.smsLimit,
    smsRemaining: plan.smsLimit === -1 ? null : Math.max(0, plan.smsLimit - user.sms_used_month),
    resetsAt: user.sms_reset_at,
    price: plan.price,
  });
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

function safeUser(user: any) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    plan: user.plan,
    createdAt: user.created_at,
  };
}

export default router;
