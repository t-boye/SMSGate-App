import 'dotenv/config';
import 'express-async-errors';
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';

import messagesRouter from './routes/messages';
import devicesRouter  from './routes/devices';
import authRouter     from './routes/auth';
import healthRouter   from './routes/health';
import landingRouter  from './routes/landing';

const app = express();

// ─── Middleware ───────────────────────────────────────────────────────────────

app.use(cors());
app.use(express.json());

// ─── API Routes ───────────────────────────────────────────────────────────────

app.use('/api/v1/messages', messagesRouter);
app.use('/api/v1/auth',     authRouter);
app.use('/api/v1',          devicesRouter);
app.use('/health',          healthRouter);

// ─── Landing page — exact GET / only (must be after all API routes) ───────────

app.use('/', landingRouter);

// ─── Error Handler ────────────────────────────────────────────────────────────

app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error('[Error]', err);
  res.status(500).json({ error: err?.message ?? 'Internal server error' });
});

app.use((_req: Request, res: Response) => {
  res.status(404).json({ error: 'Not found' });
});

// ─── Local dev server ─────────────────────────────────────────────────────────
// Vercel ignores this and uses the exported `app` directly.

if (process.env.NODE_ENV !== 'production') {
  const PORT = Number(process.env.PORT ?? 3000);
  app.listen(PORT, () => {
    console.log(`SMS Gateway server running on http://localhost:${PORT}`);
    console.log(`  Landing: http://localhost:${PORT}/`);
    console.log(`  Health:  http://localhost:${PORT}/health`);
    console.log(`  API:     http://localhost:${PORT}/api/v1/messages`);
  });
}

export default app;
