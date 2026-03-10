import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcrypt';
import { deviceDb } from '../database';
import { CreateDeviceBody } from '../types';

const router = Router();

// POST /api/v1/auth/register
// Public — no auth required. Any phone user can create their own device account.
router.post('/register', async (req: Request, res: Response) => {
  const { name, login, password } = req.body as CreateDeviceBody;

  if (!name || !login || !password) {
    res.status(400).json({ error: 'name, login, and password are required' });
    return;
  }

  if (password.length < 6) {
    res.status(400).json({ error: 'Password must be at least 6 characters' });
    return;
  }

  // Check login is not already taken
  const existing = await deviceDb.getByLogin(login);
  if (existing) {
    res.status(409).json({ error: 'Login already taken, choose another' });
    return;
  }

  const id           = uuidv4();
  const passwordHash = await bcrypt.hash(password, 10);
  const token        = uuidv4().replace(/-/g, '');

  await deviceDb.create({ id, name, login, passwordHash, token });

  res.status(201).json({ id, name, login });
});

export default router;
