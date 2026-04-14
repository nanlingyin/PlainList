import type { AuthenticatedUser, FocusSessionRecord, FocusTimerSettings } from '@plainlist/shared';
import {
  DEFAULT_FOCUS_TIMER_SETTINGS,
  FOCUS_SESSION_EXPERIENCE,
  FOCUS_SESSION_POINTS,
  USER_SETTING_KEYS,
  focusSessionIdParamSchema,
  focusSessionsQuerySchema,
  focusTimerSettingsSchema,
  startFocusSessionSchema,
} from '@plainlist/shared';
import { pool } from '../../db/pool';
import { calculateFocusReward } from '../rewards/logic';

type LegacyFocusTimerSettings = {
  focusMinutes?: number;
  shortBreakMinutes?: number;
  longBreakMinutes?: number;
  cyclesBeforeLongBreak?: number;
};

type FocusSessionRow = {
  id: number;
  status: 'active' | 'paused' | 'completed' | 'canceled';
  plan_id: number | null;
  plan_name_snapshot: string | null;
  started_at: Date | string;
  ended_at: Date | string | null;
  paused_at: Date | string | null;
  focus_minutes: number;
  break_minutes: number;
  cycle_interval: number;
  accumulated_pause_seconds: number;
  points_awarded: number;
  experience_awarded: number;
};

function serviceError(status: number, message: string): Error & { status: number } {
  return Object.assign(new Error(message), { status });
}

function normalizeDateTime(value: Date | string | null): string | null {
  if (!value) {
    return null;
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  const date = new Date(String(value));
  return Number.isNaN(date.getTime()) ? String(value) : date.toISOString();
}

function normalizeFocusTimerSettings(raw: unknown): FocusTimerSettings {
  try {
    return focusTimerSettingsSchema.parse(raw);
  } catch {
    const legacy = raw as LegacyFocusTimerSettings;
    return focusTimerSettingsSchema.parse({
      focusMinutes: legacy?.focusMinutes ?? DEFAULT_FOCUS_TIMER_SETTINGS.focusMinutes,
      breakMinutes: legacy?.shortBreakMinutes ?? DEFAULT_FOCUS_TIMER_SETTINGS.breakMinutes,
      cycles: legacy?.cyclesBeforeLongBreak ?? DEFAULT_FOCUS_TIMER_SETTINGS.cycles,
    });
  }
}

function mapFocusSession(row: FocusSessionRow): FocusSessionRecord {
  return {
    id: Number(row.id),
    status: row.status,
    planId: row.plan_id === null ? null : Number(row.plan_id),
    planName: row.plan_name_snapshot ? String(row.plan_name_snapshot) : null,
    startedAt: normalizeDateTime(row.started_at) ?? new Date().toISOString(),
    endedAt: normalizeDateTime(row.ended_at),
    pausedAt: normalizeDateTime(row.paused_at),
    focusMinutes: Number(row.focus_minutes),
    breakMinutes: Number(row.break_minutes),
    cycleInterval: Number(row.cycle_interval),
    accumulatedPauseSeconds: Number(row.accumulated_pause_seconds),
    pointsAwarded: Number(row.points_awarded ?? FOCUS_SESSION_POINTS),
    experienceAwarded: Number(row.experience_awarded ?? FOCUS_SESSION_EXPERIENCE),
  };
}

async function getUserSetting(userId: number, keyName: string): Promise<string | null> {
  const [rows] = await pool.query('SELECT value FROM user_settings WHERE user_id = ? AND key_name = ?', [userId, keyName]);
  if (!Array.isArray(rows) || rows.length === 0) {
    return null;
  }

  return String((rows[0] as { value: string }).value);
}

async function setUserSetting(userId: number, keyName: string, value: string): Promise<void> {
  await pool.query(
    `INSERT INTO user_settings (user_id, key_name, value) VALUES (?, ?, ?)
     ON DUPLICATE KEY UPDATE value = VALUES(value)`,
    [userId, keyName, value],
  );
}

async function loadOwnedPlan(userId: number, planId: number): Promise<{ id: number; name: string } | null> {
  const [rows] = await pool.query('SELECT id, name FROM plans WHERE user_id = ? AND id = ?', [userId, planId]);
  if (!Array.isArray(rows) || rows.length === 0) {
    return null;
  }

  const row = rows[0] as { id: number; name: string };
  return { id: Number(row.id), name: String(row.name) };
}

async function loadSessionForUser(userId: number, sessionId: number): Promise<FocusSessionRow> {
  const [rows] = await pool.query(
    `SELECT id, status, plan_id, plan_name_snapshot, started_at, ended_at, paused_at, focus_minutes, break_minutes, cycle_interval, accumulated_pause_seconds, points_awarded, experience_awarded
     FROM focus_sessions
     WHERE user_id = ? AND id = ?
     LIMIT 1`,
    [userId, sessionId],
  );

  if (!Array.isArray(rows) || rows.length === 0) {
    throw serviceError(404, 'focus session not found');
  }

  return rows[0] as FocusSessionRow;
}

async function loadLatestActiveSession(userId: number): Promise<FocusSessionRecord | null> {
  const [rows] = await pool.query(
    `SELECT id, status, plan_id, plan_name_snapshot, started_at, ended_at, paused_at, focus_minutes, break_minutes, cycle_interval, accumulated_pause_seconds, points_awarded, experience_awarded
     FROM focus_sessions
     WHERE user_id = ? AND status IN ('active', 'paused')
     ORDER BY started_at DESC
     LIMIT 1`,
    [userId],
  );

  if (!Array.isArray(rows) || rows.length === 0) {
    return null;
  }

  return mapFocusSession(rows[0] as FocusSessionRow);
}

export async function getFocusTimerSettings(user: AuthenticatedUser): Promise<FocusTimerSettings> {
  const raw = await getUserSetting(user.id, USER_SETTING_KEYS.focusTimerSettings);
  if (!raw) {
    return { ...DEFAULT_FOCUS_TIMER_SETTINGS };
  }

  try {
    return normalizeFocusTimerSettings(JSON.parse(raw));
  } catch {
    return { ...DEFAULT_FOCUS_TIMER_SETTINGS };
  }
}

export async function saveFocusTimerSettings(user: AuthenticatedUser, payload: unknown): Promise<FocusTimerSettings> {
  const settings = focusTimerSettingsSchema.parse(payload);
  await setUserSetting(user.id, USER_SETTING_KEYS.focusTimerSettings, JSON.stringify(settings));
  return settings;
}

export async function getActiveFocusSession(user: AuthenticatedUser): Promise<FocusSessionRecord | null> {
  return loadLatestActiveSession(user.id);
}

export async function listFocusSessions(user: AuthenticatedUser, query: unknown): Promise<FocusSessionRecord[]> {
  const input = focusSessionsQuerySchema.parse(query);
  const limit = input.limit ?? 8;
  const params: Array<string | number> = [user.id];
  let sql = `SELECT id, status, plan_id, plan_name_snapshot, started_at, ended_at, paused_at, focus_minutes, break_minutes, cycle_interval, accumulated_pause_seconds, points_awarded, experience_awarded
     FROM focus_sessions
     WHERE user_id = ?`;

  if (input.status) {
    sql += ' AND status = ?';
    params.push(input.status);
  }

  sql += ' ORDER BY started_at DESC LIMIT ?';
  params.push(limit);

  const [rows] = await pool.query(sql, params);

  if (!Array.isArray(rows)) {
    return [];
  }

  return rows.map((row) => mapFocusSession(row as FocusSessionRow));
}

export async function startFocusSession(user: AuthenticatedUser, payload: unknown): Promise<FocusSessionRecord> {
  const active = await loadLatestActiveSession(user.id);
  if (active) {
    throw serviceError(409, 'focus session already in progress');
  }

  const input = startFocusSessionSchema.parse(payload);
  const savedSettings = await getFocusTimerSettings(user);
  const focusMinutes = input.focusMinutes ?? savedSettings.focusMinutes;
  const breakMinutes = input.breakMinutes ?? savedSettings.breakMinutes;
  const cycleInterval = input.cycleInterval ?? savedSettings.cycles;

  let planName: string | null = null;
  let planId: number | null = null;

  if (input.planId) {
    const ownedPlan = await loadOwnedPlan(user.id, input.planId);
    if (!ownedPlan) {
      throw serviceError(403, 'plan not found or not owned by you');
    }

    planId = ownedPlan.id;
    planName = ownedPlan.name;
  }

  const [result] = await pool.query(
    `INSERT INTO focus_sessions (
      user_id,
      plan_id,
      plan_name_snapshot,
      status,
      focus_minutes,
      break_minutes,
      cycle_interval,
      accumulated_pause_seconds,
      points_awarded,
      experience_awarded
     ) VALUES (?, ?, ?, 'active', ?, ?, ?, 0, 0, 0)`,
    [
      user.id,
      planId,
      planName,
      focusMinutes,
      breakMinutes,
      cycleInterval,
    ],
  );

  return mapFocusSession(await loadSessionForUser(user.id, Number((result as { insertId: number }).insertId)));
}

export async function pauseFocusSession(user: AuthenticatedUser, params: unknown): Promise<FocusSessionRecord> {
  const { id } = focusSessionIdParamSchema.parse(params);
  const session = await loadSessionForUser(user.id, id);

  if (session.status !== 'active') {
    throw serviceError(409, 'focus session is not active');
  }

  await pool.query(
    `UPDATE focus_sessions
     SET status = 'paused', paused_at = CURRENT_TIMESTAMP
     WHERE id = ? AND user_id = ?`,
    [id, user.id],
  );

  return mapFocusSession(await loadSessionForUser(user.id, id));
}

export async function resumeFocusSession(user: AuthenticatedUser, params: unknown): Promise<FocusSessionRecord> {
  const { id } = focusSessionIdParamSchema.parse(params);
  const session = await loadSessionForUser(user.id, id);

  if (session.status !== 'paused' || !session.paused_at) {
    throw serviceError(409, 'focus session is not paused');
  }

  await pool.query(
    `UPDATE focus_sessions
     SET status = 'active',
         accumulated_pause_seconds = accumulated_pause_seconds + TIMESTAMPDIFF(SECOND, paused_at, CURRENT_TIMESTAMP),
         paused_at = NULL
     WHERE id = ? AND user_id = ?`,
    [id, user.id],
  );

  return mapFocusSession(await loadSessionForUser(user.id, id));
}

export async function completeFocusSession(user: AuthenticatedUser, params: unknown): Promise<FocusSessionRecord> {
  const { id } = focusSessionIdParamSchema.parse(params);
  const session = await loadSessionForUser(user.id, id);

  if (session.status !== 'active') {
    throw serviceError(409, 'focus session is not active');
  }

  const reward = calculateFocusReward(Number(session.focus_minutes), Number(session.cycle_interval));

  await pool.query(
    `UPDATE focus_sessions
     SET status = 'completed',
         ended_at = CURRENT_TIMESTAMP,
         paused_at = NULL,
         points_awarded = ?,
         experience_awarded = ?
     WHERE id = ? AND user_id = ?`,
    [reward.points, reward.experience, id, user.id],
  );

  return mapFocusSession(await loadSessionForUser(user.id, id));
}

export async function cancelFocusSession(user: AuthenticatedUser, params: unknown): Promise<FocusSessionRecord> {
  const { id } = focusSessionIdParamSchema.parse(params);
  const session = await loadSessionForUser(user.id, id);

  if (session.status !== 'active' && session.status !== 'paused') {
    throw serviceError(409, 'focus session cannot be canceled');
  }

  await pool.query(
    `UPDATE focus_sessions
     SET status = 'canceled', ended_at = CURRENT_TIMESTAMP, paused_at = NULL
     WHERE id = ? AND user_id = ?`,
    [id, user.id],
  );

  return mapFocusSession(await loadSessionForUser(user.id, id));
}
