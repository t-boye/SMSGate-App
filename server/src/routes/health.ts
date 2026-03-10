import { Router, Request, Response } from 'express';
import { pool } from '../database';

const router = Router();

router.get('/', async (_req: Request, res: Response) => {
  let dbOk = false;
  try {
    await pool.query('SELECT 1');
    dbOk = true;
  } catch {}

  res.json({
    status: dbOk ? 'ok' : 'degraded',
    db: dbOk ? 'connected' : 'error',
    timestamp: new Date().toISOString(),
  });
});

export default router;
