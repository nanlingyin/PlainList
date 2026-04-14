import { Router } from 'express';
import { ZodError } from 'zod';
import { authMiddleware, type AuthRequest } from '../../middleware/auth';
import {
  cancelFocusSession,
  completeFocusSession,
  getActiveFocusSession,
  getFocusTimerSettings,
  listFocusSessions,
  pauseFocusSession,
  resumeFocusSession,
  saveFocusTimerSettings,
  startFocusSession,
} from './service';

function respondError(error: unknown, res: any): void {
  if (error instanceof ZodError) {
    res.status(400).json({ error: 'invalid request payload' });
    return;
  }

  const status = typeof error === 'object' && error && 'status' in error ? Number((error as { status: number }).status) : 500;
  res.status(status).json({ error: error instanceof Error ? error.message : 'server error' });
}

export const focusSessionsRouter = Router();

focusSessionsRouter.use(authMiddleware);

focusSessionsRouter.get('/active', async (req, res) => {
  try {
    res.json(await getActiveFocusSession((req as AuthRequest).user));
  } catch (error) {
    respondError(error, res);
  }
});

focusSessionsRouter.get('/', async (req, res) => {
  try {
    res.json(await listFocusSessions((req as AuthRequest).user, req.query));
  } catch (error) {
    respondError(error, res);
  }
});

focusSessionsRouter.get('/settings', async (req, res) => {
  try {
    res.json(await getFocusTimerSettings((req as AuthRequest).user));
  } catch (error) {
    respondError(error, res);
  }
});

focusSessionsRouter.put('/settings', async (req, res) => {
  try {
    res.json(await saveFocusTimerSettings((req as AuthRequest).user, req.body));
  } catch (error) {
    respondError(error, res);
  }
});

focusSessionsRouter.post('/start', async (req, res) => {
  try {
    res.json(await startFocusSession((req as AuthRequest).user, req.body));
  } catch (error) {
    respondError(error, res);
  }
});

focusSessionsRouter.post('/:id/pause', async (req, res) => {
  try {
    res.json(await pauseFocusSession((req as unknown as AuthRequest).user, req.params));
  } catch (error) {
    respondError(error, res);
  }
});

focusSessionsRouter.post('/:id/resume', async (req, res) => {
  try {
    res.json(await resumeFocusSession((req as unknown as AuthRequest).user, req.params));
  } catch (error) {
    respondError(error, res);
  }
});

focusSessionsRouter.post('/:id/complete', async (req, res) => {
  try {
    res.json(await completeFocusSession((req as unknown as AuthRequest).user, req.params));
  } catch (error) {
    respondError(error, res);
  }
});

focusSessionsRouter.post('/:id/cancel', async (req, res) => {
  try {
    res.json(await cancelFocusSession((req as unknown as AuthRequest).user, req.params));
  } catch (error) {
    respondError(error, res);
  }
});
