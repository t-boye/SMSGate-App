import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import { requireUser } from '../middleware/auth';
import { userDb } from '../database';
import { PLANS, PlanName } from '../types';

const router = Router();

const PAYSTACK_SECRET = () => {
  const key = process.env.PAYSTACK_SECRET_KEY;
  if (!key) throw new Error('PAYSTACK_SECRET_KEY not set');
  return key;
};

// ─── POST /api/v1/paystack/initialize ─────────────────────────────────────────
// User initiates a subscription upgrade.
// Returns a Paystack authorization URL to redirect the user to.
router.post('/initialize', requireUser, async (req: Request, res: Response) => {
  const user = req.user!;
  const { plan } = req.body as { plan: PlanName };

  if (!plan || !PLANS[plan] || plan === 'free') {
    res.status(400).json({ error: 'Invalid plan. Choose: basic, pro, or business' });
    return;
  }

  const planConfig = PLANS[plan];
  if (!planConfig.paystackCode) {
    res.status(503).json({ error: `Paystack plan code for "${plan}" not configured` });
    return;
  }

  // Initialize a Paystack transaction with subscription intent
  const response = await fetch('https://api.paystack.co/transaction/initialize', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${PAYSTACK_SECRET()}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email: user.email,
      amount: planConfig.price * 100, // Paystack uses kobo/pesewas (smallest unit)
      currency: 'GHS',
      plan: planConfig.paystackCode,
      metadata: {
        user_id: user.id,
        plan,
        custom_fields: [
          { display_name: 'Plan', variable_name: 'plan', value: planConfig.name },
          { display_name: 'User', variable_name: 'user_id', value: user.id },
        ],
      },
      callback_url: `${process.env.APP_URL ?? 'https://sms-gate-app.vercel.app'}/api/v1/paystack/callback`,
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
// Paystack redirects here after payment. Verify and activate plan.
router.get('/callback', async (req: Request, res: Response) => {
  const { reference } = req.query as { reference: string };
  if (!reference) { res.status(400).send('Missing reference'); return; }

  const response = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
    headers: { Authorization: `Bearer ${PAYSTACK_SECRET()}` },
  });

  const data = await response.json() as any;

  if (!data.status || data.data?.status !== 'success') {
    res.redirect(`${process.env.DASHBOARD_URL ?? '/'}/billing?status=failed`);
    return;
  }

  const userId = data.data.metadata?.user_id;
  const plan   = data.data.metadata?.plan as PlanName;

  if (userId && plan && PLANS[plan]) {
    const subCode      = data.data.subscription?.subscription_code ?? null;
    const customerCode = data.data.customer?.customer_code ?? null;
    await userDb.setPlan(userId, plan, subCode, customerCode);
  }

  res.redirect(`${process.env.DASHBOARD_URL ?? '/'}/billing?status=success&plan=${plan}`);
});

// ─── POST /api/v1/paystack/webhook ────────────────────────────────────────────
// Paystack sends events here (subscription renewals, cancellations, etc.)
router.post('/webhook', async (req: Request, res: Response) => {
  const signature = req.headers['x-paystack-signature'] as string;
  const secret    = PAYSTACK_SECRET();

  // Verify webhook signature
  const hash = crypto
    .createHmac('sha512', secret)
    .update(JSON.stringify(req.body))
    .digest('hex');

  if (hash !== signature) {
    res.status(401).json({ error: 'Invalid signature' });
    return;
  }

  const event = req.body as { event: string; data: any };

  switch (event.event) {
    case 'subscription.create':
    case 'invoice.payment_succeeded': {
      // Subscription created or renewed — keep plan active
      const customerEmail = event.data?.customer?.email;
      const planCode      = event.data?.plan?.plan_code;
      const subCode       = event.data?.subscription_code ?? event.data?.data?.subscription_code;

      if (customerEmail && planCode) {
        const user = await userDb.getByEmail(customerEmail);
        if (user) {
          const plan = (Object.entries(PLANS) as [PlanName, typeof PLANS[PlanName]][])
            .find(([, p]) => p.paystackCode === planCode)?.[0];
          if (plan) {
            await userDb.setPlan(user.id, plan, subCode ?? null, event.data?.customer?.customer_code ?? null);
          }
        }
      }
      break;
    }

    case 'subscription.disable':
    case 'subscription.expiry_reminder': {
      // Subscription cancelled — downgrade to free
      const customerEmail = event.data?.customer?.email;
      if (customerEmail) {
        const user = await userDb.getByEmail(customerEmail);
        if (user) await userDb.setPlan(user.id, 'free', null, null);
      }
      break;
    }
  }

  res.json({ ok: true });
});

// ─── GET /api/v1/paystack/plans ───────────────────────────────────────────────
// Public: list available plans and pricing
router.get('/plans', (_req: Request, res: Response) => {
  res.json(
    Object.entries(PLANS).map(([key, p]) => ({
      id: key,
      name: p.name,
      price: p.price,
      smsLimit: p.smsLimit,
      currency: 'GHS',
    })),
  );
});

export default router;
