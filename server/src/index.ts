import 'dotenv/config';
import 'express-async-errors';
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';

import messagesRouter from './routes/messages';
import devicesRouter  from './routes/devices';
import authRouter     from './routes/auth';
import usersRouter    from './routes/users';
import paystackRouter from './routes/paystack';
import healthRouter   from './routes/health';
import landingRouter  from './routes/landing';

const app = express();

app.use(cors());
app.use(express.json());

// ─── API Routes ───────────────────────────────────────────────────────────────

app.use('/api/v1/messages',  messagesRouter);
app.use('/api/v1/users',     usersRouter);
app.use('/api/v1/paystack',  paystackRouter);
app.use('/api/v1/auth',      authRouter);      // device registration (legacy)
app.use('/api/v1',           devicesRouter);
app.use('/health',           healthRouter);
app.use('/',                 landingRouter);

// ─── Error Handler ────────────────────────────────────────────────────────────

app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error('[Error]', err);
  res.status(500).json({ error: err?.message ?? 'Internal server error' });
});

app.use((_req: Request, res: Response) => {
  res.status(404).json({ error: 'Not found' });
});

const PORT = Number(process.env.PORT ?? 3001);
app.listen(PORT, () => console.log(`SMS Gateway server running on http://localhost:${PORT}`));

export default app;
