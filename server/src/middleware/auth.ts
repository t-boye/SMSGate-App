import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { deviceDb, apiKeyDb, userDb } from '../database';

function parseBasicAuth(header: string): { login: string; password: string } | null {
  if (!header.startsWith('Basic ')) return null;
  try {
    const decoded = Buffer.from(header.slice(6), 'base64').toString('utf8');
    const colon = decoded.indexOf(':');
    if (colon < 0) return null;
    return { login: decoded.slice(0, colon), password: decoded.slice(colon + 1) };
  } catch { return null; }
}

function parseBearerToken(header: string): string | null {
  if (!header.startsWith('Bearer ')) return null;
  return header.slice(7).trim() || null;
}

// ─── JWT helpers ──────────────────────────────────────────────────────────────

export function signUserToken(userId: string): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('JWT_SECRET not configured');
  return jwt.sign({ sub: userId }, secret, { expiresIn: '30d' });
}

// ─── User Auth (for dashboard API) ───────────────────────────────────────────

export async function requireUser(req: Request, res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers['authorization'] ?? '';
  const token = parseBearerToken(authHeader);
  if (!token) { res.status(401).json({ error: 'User auth required' }); return; }

  try {
    const secret = process.env.JWT_SECRET;
    if (!secret) throw new Error('JWT_SECRET not configured');
    const payload = jwt.verify(token, secret) as { sub: string };
    const user = await userDb.getById(payload.sub);
    if (!user) { res.status(401).json({ error: 'User not found' }); return; }
    req.user = user;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
}

// ─── Device Auth (Android app polling) ───────────────────────────────────────

export async function requireDevice(req: Request, res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers['authorization'] ?? '';

  const token = parseBearerToken(authHeader);
  if (token) {
    const device = await deviceDb.getByToken(token);
    if (device) { req.device = device; return next(); }
  }

  const basic = parseBasicAuth(authHeader);
  if (basic) {
    const device = await deviceDb.getByLogin(basic.login);
    if (device) {
      const valid = await bcrypt.compare(basic.password, device.password_hash);
      if (valid) { req.device = device; return next(); }
    }
  }

  res.status(401).json({ error: 'Unauthorized' });
}

// ─── API Key Auth (external SMS submission) ───────────────────────────────────

export async function requireApiKey(req: Request, res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers['authorization'] ?? '';
  const token = parseBearerToken(authHeader);
  if (!token) { res.status(401).json({ error: 'Bearer API key required' }); return; }

  const key = await apiKeyDb.get(token);
  if (!key) { res.status(401).json({ error: 'Invalid API key' }); return; }

  req.apiKey = key;

  // Attach user context if the key is scoped to a user
  if (key.user_id) {
    const user = await userDb.getById(key.user_id);
    if (user) req.user = user;
  }

  next();
}

// ─── Admin Auth (server admin operations) ────────────────────────────────────

export function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  const adminKey = process.env.ADMIN_KEY;
  if (!adminKey) { res.status(503).json({ error: 'Admin key not configured' }); return; }
  const token = parseBearerToken(req.headers['authorization'] ?? '');
  if (token !== adminKey) { res.status(401).json({ error: 'Invalid admin key' }); return; }
  next();
}
