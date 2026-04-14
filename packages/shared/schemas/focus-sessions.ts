import { z } from 'zod';
import {
  DEFAULT_FOCUS_TIMER_SETTINGS,
  MAX_BREAK_MINUTES,
  MAX_CYCLE_INTERVAL,
  MAX_FOCUS_MINUTES,
  MIN_BREAK_MINUTES,
  MIN_CYCLE_INTERVAL,
  MIN_FOCUS_MINUTES,
} from '../constants/rewards';
import { aiReviewPeriodSchema } from './ai-reviews';

export const focusSessionIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export const focusSessionsQuerySchema = z.object({
  limit: z.coerce.number().int().positive().max(200).optional(),
  status: z.enum(['active', 'paused', 'completed', 'canceled']).optional(),
});

export const startFocusSessionSchema = z.object({
  planId: z.coerce.number().int().positive().optional(),
  focusMinutes: z.coerce.number().int().min(MIN_FOCUS_MINUTES).max(MAX_FOCUS_MINUTES).optional(),
  breakMinutes: z.coerce.number().int().min(MIN_BREAK_MINUTES).max(MAX_BREAK_MINUTES).optional(),
  cycleInterval: z.coerce.number().int().min(MIN_CYCLE_INTERVAL).max(MAX_CYCLE_INTERVAL).optional(),
});

export const focusTimerSettingsSchema = z.object({
  focusMinutes: z.coerce.number().int().min(MIN_FOCUS_MINUTES).max(MAX_FOCUS_MINUTES),
  breakMinutes: z.coerce.number().int().min(MIN_BREAK_MINUTES).max(MAX_BREAK_MINUTES),
  cycles: z.coerce.number().int().min(MIN_CYCLE_INTERVAL).max(MAX_CYCLE_INTERVAL),
});

export const rewardPeriodQuerySchema = z.object({
  period: aiReviewPeriodSchema,
  referenceDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});

export const purchaseStoreItemSchema = z.object({
  itemId: z.enum(['makeup-card']),
  quantity: z.coerce.number().int().positive().max(5).optional().default(1),
});

export const useMakeupCardSchema = z.object({
  planId: z.coerce.number().int().positive(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});
