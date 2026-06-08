import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import { requireUser } from '../middleware/auth';
import { userDb } from '../database';
import { PLANS, PlanName } from '../types';

const router = Router();

// Plan prices in GHS (pesewas × 100)
const PLAN_PRICES_GHS: Record<PlanName, number> = {
  free:     0,
  basic:    1500,    // GHS 15 / month
  pro:      4000,    // GHS 40 / month
  business: 10000,   // GHS 100 / month
};

const PAYSTACK_SECRET = () => {
  const key = process.env.PAYSTACK_SECRET_KEY;
  if (!key) throw new Error('PAYSTACK_SECRET_KEY not set');
  return key;
};

// ─── GET /api/v1/paystack/plans ───────────────────────────────────────────────
router.get('/plans', (_req: Request, res: Response) => {
  res.json(
    Object.entries(PLANS).map(([key, p]) => ({
      id: key,
      name: p.name,
      price: p.price,
      priceGhs: PLAN_PRICES_GHS[key as PlanName] / 100,
      smsLimit: p.smsLimit,
    })),
  );
});

// ─── POST /api/v1/paystack/initialize ─────────────────────────────────────────
// User pays for a plan upgrade — simple one-time transaction (no plan codes needed).
router.post('/initialize', requireUser, async (req: Request, res: Response) => {
  const user = req.user!;
  const { plan } = req.body as { plan: PlanName };

  if (!plan || !PLANS[plan] || plan === 'free') {
    res.status(400).json({ error: 'Invalid plan. Choose: basic, pro, or business' });
    return;
  }

  const amount = PLAN_PRICES_GHS[plan];
  const dashboardUrl = process.env.DASHBOARD_URL ?? 'https://sms-gate-app-t3ay.vercel.app';

  const response = await fetch('https://api.paystack.co/transaction/initialize', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${PAYSTACK_SECRET()}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email: user.email,
      amount,
      currency: 'GHS',
      metadata: {
        user_id: user.id,
        plan,
        custom_fields: [
          { display_name: 'Plan', variable_name: 'plan', value: PLANS[plan].name },
        ],
      },
      callback_url: `${process.env.APP_URL ?? dashboardUrl}/api/v1/paystack/callback`,
    }),
  });

  const data = await response.json() as any;
  if (!data.status) {
    res.status(502).json({ error: data.message ?? 'Paystack error' });
    return;
  }

  res.json({
    authorizationUrl: data.data.authorization_url,
    reference: data.data.reference,
  });
});

// ─── GET /api/v1/paystack/callback ────────────────────────────────────────────
router.get('/callback', async (req: Request, res: Response) => {
  const { reference } = req.query as { reference: string };
  if (!reference) { res.redirect(`${process.env.DASHBOARD_URL}/billing?status=failed`); return; }

  const response = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
    headers: { Authorization: `Bearer ${PAYSTACK_SECRET()}` },
  });

  const data = await response.json() as any;

  if (!data.status || data.data?.status !== 'success') {
    res.redirect(`${process.env.DASHBOARD_URL}/billing?status=failed`);
    return;
  }

  const userId = data.data.metadata?.user_id;
  const plan   = data.data.metadata?.plan as PlanName;

  if (userId && plan && PLANS[plan]) {
    // Activate plan for 30 days — set reset_at 30 days from now
    await userDb.setPlan(userId, plan, null, data.data.customer?.customer_code ?? null);
    await userDb.setSmsPlanExpiry(userId);
  }

  res.redirect(`${process.env.DASHBOARD_URL}/billing?status=success&plan=${plan}`);
});

// ─── POST /api/v1/paystack/webhook ────────────────────────────────────────────
router.post('/webhook', async (req: Request, res: Response) => {
  const signature = req.headers['x-paystack-signature'] as string;
  const hash = crypto
    .createHmac('sha512', PAYSTACK_SECRET())
    .update(JSON.stringify(req.body))
    .digest('hex');

  if (hash !== signature) { res.status(401).json({ error: 'Invalid signature' }); return; }

  const event = req.body as { event: string; data: any };

  // charge.success fires on every successful payment
  if (event.event === 'charge.success') {
    const userId = event.data?.metadata?.user_id;
    const plan   = event.data?.metadata?.plan as PlanName;
    if (userId && plan && PLANS[plan]) {
      await userDb.setPlan(userId, plan, null, event.data?.customer?.customer_code ?? null);
      await userDb.setSmsPlanExpiry(userId);
    }
  }

  res.json({ ok: true });
});

// ─── POST /api/v1/paystack/verify ─────────────────────────────────────────────
// Dashboard calls this to verify payment after redirect
router.post('/verify', requireUser, async (req: Request, res: Response) => {
  const { reference } = req.body as { reference: string };
  if (!reference) { res.status(400).json({ error: 'reference required' }); return; }

  const response = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
    headers: { Authorization: `Bearer ${PAYSTACK_SECRET()}` },
  });

  const data = await response.json() as any;
  if (!data.status || data.data?.status !== 'success') {
    res.status(402).json({ error: 'Payment not confirmed' });
    return;
  }

  const plan = data.data.metadata?.plan as PlanName;
  if (data.data.metadata?.user_id === req.user!.id && plan && PLANS[plan]) {
    await userDb.setPlan(req.user!.id, plan, null, data.data.customer?.customer_code ?? null);
    await userDb.setSmsPlanExpiry(req.user!.id);
  }

  res.json({ ok: true, plan });
});

export default router;
