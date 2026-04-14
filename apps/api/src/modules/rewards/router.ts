import { Router } from 'express';
import { ZodError } from 'zod';
import { authMiddleware, type AuthRequest } from '../../middleware/auth';
import {
  getRewardOverview,
  getRewardPeriodSummary,
  purchaseStoreItem,
  useMakeupCard,
} from './service';

function respondError(error: unknown, res: any): void {
  if (error instanceof ZodError) {
    res.status(400).json({ error: 'invalid request payload' });
    return;
  }

  const status = typeof error === 'object' && error && 'status' in error ? Number((error as { status: number }).status) : 500;
  res.status(status).json({ error: error instanceof Error ? error.message : 'server error' });
}

export const rewardsRouter = Router();

rewardsRouter.use(authMiddleware);

rewardsRouter.get('/overview', async (req, res) => {
  try {
    res.json(await getRewardOverview((req as AuthRequest).user));
  } catch (error) {
    respondError(error, res);
  }
});

rewardsRouter.get('/period', async (req, res) => {
  try {
    res.json(await getRewardPeriodSummary((req as AuthRequest).user, req.query));
  } catch (error) {
    respondError(error, res);
  }
});

rewardsRouter.post('/store/purchase', async (req, res) => {
  try {
    await purchaseStoreItem((req as AuthRequest).user, req.body);
    res.json({ ok: true });
  } catch (error) {
    respondError(error, res);
  }
});

rewardsRouter.post('/makeup-cards/use', async (req, res) => {
  try {
    await useMakeupCard((req as AuthRequest).user, req.body);
    res.json({ ok: true });
  } catch (error) {
    respondError(error, res);
  }
});
