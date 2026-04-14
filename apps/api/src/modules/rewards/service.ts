import type { AuthenticatedUser, RewardOverview, RewardPeriodSummary } from '@plainlist/shared';
import {
  STORE_ITEM_DEFINITIONS,
  purchaseStoreItemSchema,
  rewardPeriodQuerySchema,
  toDateKey,
  useMakeupCardSchema,
} from '@plainlist/shared';
import { pool } from '../../db/pool';
import { buildRewardModel, buildRewardOverview, buildRewardPeriodSummary } from './logic';

type PlanRow = {
  id: number;
  created_at: Date | string;
  name?: string;
};

type CheckRow = {
  plan_id: number;
  check_date: Date | string;
  done: number;
};

type FocusRow = {
  id: number;
  plan_id: number | null;
  plan_name_snapshot: string | null;
  started_at: Date | string;
  ended_at: Date | string;
  focus_minutes: number;
  break_minutes: number;
  cycle_interval: number;
  points_awarded: number;
  experience_awarded: number;
};

type PurchaseRow = {
  item_id: string;
  points_spent: number;
};

type InventoryRow = {
  item_id: string;
  quantity: number;
};

function serviceError(status: number, message: string): Error & { status: number } {
  return Object.assign(new Error(message), { status });
}

function normalizeDateTime(value: Date | string): string {
  if (value instanceof Date) {
    return value.toISOString();
  }

  const date = new Date(String(value));
  return Number.isNaN(date.getTime()) ? String(value) : date.toISOString();
}

function normalizeDateKey(value: Date | string): string {
  if (value instanceof Date) {
    return toDateKey(value);
  }

  return String(value).slice(0, 10);
}

async function loadRewardModel(userId: number) {
  const [planRows, checkRows, focusRows, purchaseRows, inventoryRows] = await Promise.all([
    pool.query('SELECT id, created_at FROM plans WHERE user_id = ? ORDER BY created_at, id', [userId]),
    pool.query(
      `SELECT c.plan_id, c.check_date, c.done
       FROM checks c
       INNER JOIN plans p ON p.id = c.plan_id
       WHERE p.user_id = ?
       ORDER BY c.check_date`,
      [userId],
    ),
    pool.query(
      `SELECT id, plan_id, plan_name_snapshot, started_at, ended_at, focus_minutes, break_minutes, cycle_interval, points_awarded, experience_awarded
       FROM focus_sessions
       WHERE user_id = ? AND status = 'completed' AND ended_at IS NOT NULL
       ORDER BY ended_at`,
      [userId],
    ),
    pool.query(
      'SELECT item_id, points_spent FROM store_purchases WHERE user_id = ? ORDER BY purchased_at',
      [userId],
    ),
    pool.query('SELECT item_id, quantity FROM user_inventory WHERE user_id = ? AND quantity > 0', [userId]),
  ]);

  const plans = Array.isArray(planRows[0])
    ? planRows[0].map((row) => ({
      id: Number((row as PlanRow).id),
      createdAt: normalizeDateTime((row as PlanRow).created_at),
    }))
    : [];

  const checks = Array.isArray(checkRows[0])
    ? checkRows[0].map((row) => ({
      planId: Number((row as CheckRow).plan_id),
      date: normalizeDateKey((row as CheckRow).check_date),
      done: Boolean((row as CheckRow).done),
    }))
    : [];

  const focusSessions = Array.isArray(focusRows[0])
    ? focusRows[0].map((row) => ({
      id: Number((row as FocusRow).id),
      planId: (row as FocusRow).plan_id === null ? null : Number((row as FocusRow).plan_id),
      planName: (row as FocusRow).plan_name_snapshot ? String((row as FocusRow).plan_name_snapshot) : null,
      startedAt: normalizeDateTime((row as FocusRow).started_at),
      endedAt: normalizeDateTime((row as FocusRow).ended_at),
      focusMinutes: Number((row as FocusRow).focus_minutes),
      breakMinutes: Number((row as FocusRow).break_minutes),
      cycleInterval: Number((row as FocusRow).cycle_interval),
      pointsAwarded: Number((row as FocusRow).points_awarded),
      experienceAwarded: Number((row as FocusRow).experience_awarded),
    }))
    : [];

  const purchases = Array.isArray(purchaseRows[0])
    ? purchaseRows[0].map((row) => ({
      itemId: String((row as PurchaseRow).item_id),
      pointsSpent: Number((row as PurchaseRow).points_spent),
    }))
    : [];

  const inventory = Array.isArray(inventoryRows[0])
    ? inventoryRows[0].map((row) => ({
      itemId: String((row as InventoryRow).item_id) as 'makeup-card',
      quantity: Number((row as InventoryRow).quantity),
    }))
    : [];

  return buildRewardModel(plans, checks, focusSessions, purchases, inventory);
}

async function loadOwnedPlan(userId: number, planId: number) {
  const [rows] = await pool.query('SELECT id, name FROM plans WHERE user_id = ? AND id = ?', [userId, planId]);
  if (!Array.isArray(rows) || rows.length === 0) {
    return null;
  }

  const row = rows[0] as PlanRow;
  return { id: Number(row.id), name: String(row.name ?? '') };
}

export async function getRewardOverview(user: AuthenticatedUser): Promise<RewardOverview> {
  const model = await loadRewardModel(user.id);
  return buildRewardOverview(model);
}

export async function getRewardPeriodSummary(user: AuthenticatedUser, query: unknown): Promise<RewardPeriodSummary> {
  const input = rewardPeriodQuerySchema.parse(query);
  const model = await loadRewardModel(user.id);
  return buildRewardPeriodSummary(model, input.period, input.referenceDate ?? toDateKey(new Date()));
}

export async function purchaseStoreItem(user: AuthenticatedUser, payload: unknown): Promise<void> {
  const input = purchaseStoreItemSchema.parse(payload);
  const definition = STORE_ITEM_DEFINITIONS.find((item) => item.id === input.itemId);
  if (!definition) {
    throw serviceError(404, 'store item not found');
  }

  const overview = await getRewardOverview(user);
  const totalCost = definition.pointsCost * input.quantity;
  if (overview.spendablePoints < totalCost) {
    throw serviceError(400, 'not enough points');
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    await connection.query(
      `INSERT INTO user_inventory (user_id, item_id, quantity) VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE quantity = quantity + VALUES(quantity)`,
      [user.id, input.itemId, input.quantity],
    );
    await connection.query(
      'INSERT INTO store_purchases (user_id, item_id, quantity, points_spent) VALUES (?, ?, ?, ?)',
      [user.id, input.itemId, input.quantity, totalCost],
    );
    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

export async function useMakeupCard(user: AuthenticatedUser, payload: unknown): Promise<void> {
  const input = useMakeupCardSchema.parse(payload);
  const todayKey = toDateKey(new Date());
  if (input.date >= todayKey) {
    throw serviceError(400, 'makeup cards can only be used on past dates');
  }

  const plan = await loadOwnedPlan(user.id, input.planId);
  if (!plan) {
    throw serviceError(403, 'plan not found or not owned by you');
  }

  const [existingRows] = await pool.query(
    `SELECT c.done
     FROM checks c
     INNER JOIN plans p ON p.id = c.plan_id
     WHERE p.user_id = ? AND c.plan_id = ? AND c.check_date = ?
     LIMIT 1`,
    [user.id, input.planId, input.date],
  );

  if (Array.isArray(existingRows) && existingRows.length > 0 && Boolean((existingRows[0] as { done: number }).done)) {
    throw serviceError(400, 'selected plan is already completed on that date');
  }

  const [usageRows] = await pool.query(
    'SELECT id FROM makeup_card_uses WHERE user_id = ? AND plan_id = ? AND check_date = ?',
    [user.id, input.planId, input.date],
  );

  if (Array.isArray(usageRows) && usageRows.length > 0) {
    throw serviceError(400, 'makeup card has already been used for that plan and date');
  }

  const [inventoryRows] = await pool.query(
    'SELECT quantity FROM user_inventory WHERE user_id = ? AND item_id = ? LIMIT 1',
    [user.id, 'makeup-card'],
  );
  const quantity = Array.isArray(inventoryRows) && inventoryRows.length > 0
    ? Number((inventoryRows[0] as { quantity: number }).quantity)
    : 0;

  if (quantity <= 0) {
    throw serviceError(400, 'no makeup cards available');
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    await connection.query(
      `INSERT INTO checks (plan_id, check_date, done) VALUES (?, ?, 1)
       ON DUPLICATE KEY UPDATE done = VALUES(done)`,
      [input.planId, input.date],
    );
    await connection.query(
      'UPDATE user_inventory SET quantity = quantity - 1 WHERE user_id = ? AND item_id = ? AND quantity > 0',
      [user.id, 'makeup-card'],
    );
    await connection.query(
      'INSERT INTO makeup_card_uses (user_id, plan_id, check_date) VALUES (?, ?, ?)',
      [user.id, input.planId, input.date],
    );
    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}
