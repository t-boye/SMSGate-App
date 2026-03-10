import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcrypt';
import { deviceDb, apiKeyDb } from '../database';

function parseBasicAuth(header: string): { login: string; password: string } | null {
  if (!header.startsWith('Basic ')) return null;
  try {
    const decoded = Buffer.from(header.slice(6), 'base64').toString('utf8');
    const colon = decoded.indexOf(':');
    if (colon < 0) return null;
    return { login: decoded.slice(0, colon), password: decoded.slice(colon + 1) };
  } catch {
    return null;
  }
}

function parseBearerToken(header: string): string | null {
  if (!header.startsWith('Bearer ')) return null;
  return header.slice(7).trim() || null;
}

// ─── Device Auth (for SSE connection) ─────────────────────────────────────────
// Accepts: Basic Auth (login:password) OR Bearer token

export async function requireDevice(req: Request, res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers['authorization'] ?? '';

  // Try bearer token first
  const token = parseBearerToken(authHeader);
  if (token) {
    const device = await deviceDb.getByToken(token);
    if (device) {
      req.device = device;
      return next();
    }
  }

  // Try basic auth
  const basic = parseBasicAuth(authHeader);
  if (basic) {
    const device = await deviceDb.getByLogin(basic.login);
    if (device) {
      const valid = await bcrypt.compare(basic.password, device.password_hash);
      if (valid) {
        req.device = device;
        return next();
      }
    }
  }

  res.status(401).json({ error: 'Unauthorized' });
}

// ─── API Key Auth (for client SMS submission) ──────────────────────────────────

export async function requireApiKey(req: Request, res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers['authorization'] ?? '';
  const token = parseBearerToken(authHeader);
  if (!token) {
    res.status(401).json({ error: 'Bearer API key required' });
    return;
  }
  const key = await apiKeyDb.get(token);
  if (!key) {
    res.status(401).json({ error: 'Invalid API key' });
    return;
  }
  req.apiKey = key;
  next();
}

// ─── Admin Auth (for managing devices and keys) ────────────────────────────────

export function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  const adminKey = process.env.ADMIN_KEY;
  if (!adminKey) {
    res.status(503).json({ error: 'Admin key not configured on server' });
    return;
  }
  const authHeader = req.headers['authorization'] ?? '';
  const token = parseBearerToken(authHeader);
  if (token !== adminKey) {
    res.status(401).json({ error: 'Invalid admin key' });
    return;
  }
  next();
}
