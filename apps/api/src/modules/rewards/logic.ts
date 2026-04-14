import type {
  AiReviewPeriod,
  RewardBadgeId,
  RewardBadgeProgress,
  RewardEvent,
  RewardInventoryItem,
  RewardOverview,
  RewardPeriodSummary,
  RewardStoreItem,
} from '@plainlist/shared';
import {
  DEFAULT_FOCUS_MINUTES,
  FOCUS_SESSION_EXPERIENCE,
  FOCUS_SESSION_POINTS,
  MAX_LEVEL,
  PERFECT_DAY_EXPERIENCE,
  PERFECT_DAY_POINTS,
  REWARD_BADGE_DEFINITIONS,
  STORE_ITEM_DEFINITIONS,
  getMonthRange,
  getWeekStart,
  toDateKey,
} from '@plainlist/shared';

type RewardPlanInput = {
  id: number;
  createdAt: string;
};

type RewardCheckInput = {
  planId: number;
  date: string;
  done: boolean;
};

type RewardFocusInput = {
  id: number;
  planId: number | null;
  planName: string | null;
  startedAt: string;
  endedAt: string;
  focusMinutes: number;
  breakMinutes: number;
  cycleInterval: number;
  pointsAwarded: number;
  experienceAwarded: number;
};

type RewardPurchaseInput = {
  itemId: string;
  pointsSpent: number;
};

type PerfectDayInfo = {
  date: string;
  achievedAt: string;
  pointsAwarded: number;
  experienceAwarded: number;
};

type RewardModel = {
  todayKey: string;
  focusSessions: RewardFocusInput[];
  perfectDays: PerfectDayInfo[];
  badges: RewardBadgeProgress[];
  recentEvents: RewardEvent[];
  completedFocusSessionsToday: number;
  perfectDaysToday: number;
  currentPerfectStreak: number;
  longestPerfectStreak: number;
  spentPoints: number;
  inventory: RewardInventoryItem[];
};

function parseDateKey(value: string): Date {
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  date.setHours(0, 0, 0, 0);
  return date;
}

function enumerateDateKeys(from: string, to: string): string[] {
  if (from > to) {
    return [];
  }

  const result: string[] = [];
  const cursor = parseDateKey(from);
  const end = parseDateKey(to);

  while (cursor <= end) {
    result.push(toDateKey(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }

  return result;
}

function atDayEnd(dateKey: string): string {
  return `${dateKey}T23:59:59.000Z`;
}

function minDateKey(values: string[]): string | null {
  if (values.length === 0) {
    return null;
  }

  return [...values].sort()[0];
}

function buildPeriodWindow(period: AiReviewPeriod, referenceDate: string, todayKey: string) {
  const reference = parseDateKey(referenceDate);
  let from = referenceDate;
  let periodEnd = referenceDate;

  switch (period) {
    case 'day':
      from = referenceDate;
      periodEnd = referenceDate;
      break;
    case 'week': {
      const start = getWeekStart(reference);
      from = toDateKey(start);
      const end = new Date(start);
      end.setDate(start.getDate() + 6);
      periodEnd = toDateKey(end);
      break;
    }
    case 'month': {
      const range = getMonthRange(reference.getFullYear(), reference.getMonth());
      from = range.from;
      periodEnd = range.to;
      break;
    }
    case 'year':
      from = `${reference.getFullYear()}-01-01`;
      periodEnd = `${reference.getFullYear()}-12-31`;
      break;
  }

  const to = [periodEnd, referenceDate, todayKey].sort()[0];
  return { from, to };
}

export function calculateFocusReward(focusMinutes: number, cycleInterval: number) {
  const durationFactor = Math.min(2.2, Math.max(0.6, focusMinutes / DEFAULT_FOCUS_MINUTES));
  const cycleFactor = Math.min(1.3, 1 + Math.max(cycleInterval - 4, 0) * 0.06);
  const multiplier = durationFactor * cycleFactor;

  return {
    points: Math.max(6, Math.round(FOCUS_SESSION_POINTS * multiplier)),
    experience: Math.max(8, Math.round(FOCUS_SESSION_EXPERIENCE * multiplier)),
  };
}

function badgeProgressValue(id: RewardBadgeId, focusCount: number, perfectCount: number, longestStreak: number): number {
  switch (id) {
    case 'first-focus':
    case 'focus-8':
    case 'focus-25':
      return focusCount;
    case 'perfect-day-1':
      return perfectCount;
    case 'streak-3':
    case 'streak-7':
      return longestStreak;
  }
}

function cumulativeXpForLevel(level: number): number {
  let total = 0;
  for (let current = 1; current < level; current += 1) {
    total += Math.round(80 * Math.pow(1.45, current - 1));
  }
  return total;
}

export function getLevelProgress(totalExperience: number) {
  let level = 1;
  while (level < MAX_LEVEL) {
    const nextRequirement = cumulativeXpForLevel(level + 1);
    if (totalExperience < nextRequirement) {
      break;
    }
    level += 1;
  }

  const currentLevelExperience = cumulativeXpForLevel(level);
  const nextLevelExperience = level >= MAX_LEVEL ? null : cumulativeXpForLevel(level + 1);

  return {
    level,
    currentLevelExperience,
    nextLevelExperience,
  };
}

export function buildRewardModel(
  plans: RewardPlanInput[],
  checks: RewardCheckInput[],
  focusSessions: RewardFocusInput[],
  purchases: RewardPurchaseInput[],
  inventory: RewardInventoryItem[],
  todayKey = toDateKey(new Date()),
): RewardModel {
  const sortedFocusSessions = [...focusSessions].sort((left, right) => left.endedAt.localeCompare(right.endedAt));
  const createdPlans = plans.map((plan) => ({
    ...plan,
    createdKey: plan.createdAt.slice(0, 10),
  })).sort((left, right) => left.createdKey.localeCompare(right.createdKey));

  const firstPlanDate = minDateKey(createdPlans.map((plan) => plan.createdKey));
  const checkMap = checks.reduce((result, row) => {
    result.set(`${row.planId}:${row.date}`, row.done);
    return result;
  }, new Map<string, boolean>());

  const perfectDays: PerfectDayInfo[] = [];
  const streakAchievements = new Map<number, string>();
  let currentStreak = 0;
  let longestStreak = 0;

  if (firstPlanDate) {
    const dateKeys = enumerateDateKeys(firstPlanDate, todayKey);
    for (const dateKey of dateKeys) {
      const activePlans = createdPlans.filter((plan) => plan.createdKey <= dateKey);
      if (activePlans.length === 0) {
        continue;
      }

      const isPerfect = activePlans.every((plan) => checkMap.get(`${plan.id}:${dateKey}`) === true);
      if (isPerfect) {
        perfectDays.push({
          date: dateKey,
          achievedAt: atDayEnd(dateKey),
          pointsAwarded: PERFECT_DAY_POINTS,
          experienceAwarded: PERFECT_DAY_EXPERIENCE,
        });
        currentStreak += 1;
        longestStreak = Math.max(longestStreak, currentStreak);
        if ((currentStreak === 3 || currentStreak === 7) && !streakAchievements.has(currentStreak)) {
          streakAchievements.set(currentStreak, atDayEnd(dateKey));
        }
      } else {
        currentStreak = 0;
      }
    }
  }

  const todayPerfect = perfectDays.some((item) => item.date === todayKey);
  const focusCount = sortedFocusSessions.length;
  const perfectCount = perfectDays.length;

  const badges = REWARD_BADGE_DEFINITIONS.map<RewardBadgeProgress>((definition) => {
    const progress = badgeProgressValue(definition.id, focusCount, perfectCount, longestStreak);
    let achievedAt: string | null = null;

    if (definition.id === 'perfect-day-1') {
      achievedAt = perfectDays[definition.target - 1]?.achievedAt ?? null;
    } else if (definition.id === 'streak-3' || definition.id === 'streak-7') {
      achievedAt = streakAchievements.get(definition.target) ?? null;
    } else {
      achievedAt = sortedFocusSessions[definition.target - 1]?.endedAt ?? null;
    }

    return {
      id: definition.id,
      metric: definition.metric,
      target: definition.target,
      progress,
      earned: progress >= definition.target,
      achievedAt,
    };
  });

  const recentEvents = [
    ...sortedFocusSessions.map<RewardEvent>((session) => ({
      id: `focus-${session.id}`,
      kind: 'focus-session',
      occurredAt: session.endedAt,
      points: session.pointsAwarded,
      experience: session.experienceAwarded,
      date: session.endedAt.slice(0, 10),
      planId: session.planId,
      planName: session.planName,
    })),
    ...perfectDays.map<RewardEvent>((item) => ({
      id: `perfect-${item.date}`,
      kind: 'perfect-day',
      occurredAt: item.achievedAt,
      points: item.pointsAwarded,
      experience: item.experienceAwarded,
      date: item.date,
    })),
  ]
    .sort((left, right) => right.occurredAt.localeCompare(left.occurredAt))
    .slice(0, 8);

  const completedFocusSessionsToday = sortedFocusSessions.filter((session) => session.endedAt.slice(0, 10) === todayKey).length;
  const spentPoints = purchases.reduce((sum, item) => sum + item.pointsSpent, 0);

  return {
    todayKey,
    focusSessions: sortedFocusSessions,
    perfectDays,
    badges,
    recentEvents,
    completedFocusSessionsToday,
    perfectDaysToday: todayPerfect ? 1 : 0,
    currentPerfectStreak: currentStreak,
    longestPerfectStreak: longestStreak,
    spentPoints,
    inventory,
  };
}

export function buildRewardOverview(model: RewardModel): RewardOverview {
  const totalPoints = model.focusSessions.reduce((sum, session) => sum + session.pointsAwarded, 0)
    + model.perfectDays.reduce((sum, item) => sum + item.pointsAwarded, 0);
  const totalExperience = model.focusSessions.reduce((sum, session) => sum + session.experienceAwarded, 0)
    + model.perfectDays.reduce((sum, item) => sum + item.experienceAwarded, 0);
  const { level, currentLevelExperience, nextLevelExperience } = getLevelProgress(totalExperience);
  const inventoryMap = new Map(model.inventory.map((item) => [item.itemId, item.quantity]));
  const storeItems: RewardStoreItem[] = STORE_ITEM_DEFINITIONS.map((definition) => ({
    itemId: definition.id,
    pointsCost: definition.pointsCost,
    ownedQuantity: inventoryMap.get(definition.id) ?? 0,
  }));

  return {
    totalPoints,
    spendablePoints: Math.max(totalPoints - model.spentPoints, 0),
    totalPointsSpent: model.spentPoints,
    totalExperience,
    level,
    currentLevelExperience,
    nextLevelExperience,
    todayPoints: model.focusSessions
      .filter((session) => session.endedAt.slice(0, 10) === model.todayKey)
      .reduce((sum, session) => sum + session.pointsAwarded, 0)
      + (model.perfectDaysToday ? PERFECT_DAY_POINTS : 0),
    completedFocusSessions: model.focusSessions.length,
    completedFocusSessionsToday: model.completedFocusSessionsToday,
    perfectDays: model.perfectDays.length,
    perfectDaysToday: model.perfectDaysToday,
    currentPerfectStreak: model.currentPerfectStreak,
    longestPerfectStreak: model.longestPerfectStreak,
    badges: model.badges,
    recentEvents: model.recentEvents,
    inventory: model.inventory,
    storeItems,
  };
}

export function buildRewardPeriodSummary(model: RewardModel, period: AiReviewPeriod, referenceDate = model.todayKey): RewardPeriodSummary {
  const window = buildPeriodWindow(period, referenceDate, model.todayKey);
  const emptySummary = {
    period,
    periodLabel: `${period} rewards ${window.from}${window.from === window.to ? '' : ` ~ ${window.to}`}`,
    referenceDate,
    from: window.from,
    to: window.to,
    points: 0,
    completedFocusSessions: 0,
    perfectDays: 0,
    earnedBadges: 0,
  } satisfies RewardPeriodSummary;

  if (window.from > window.to) {
    return emptySummary;
  }

  const completedSessions = model.focusSessions.filter((session) => {
    const dateKey = session.endedAt.slice(0, 10);
    return dateKey >= window.from && dateKey <= window.to;
  });

  const perfectDayItems = model.perfectDays.filter((item) => item.date >= window.from && item.date <= window.to);

  const earnedBadges = model.badges.filter((badge) => {
    if (!badge.earned || !badge.achievedAt) {
      return false;
    }

    const dateKey = badge.achievedAt.slice(0, 10);
    return dateKey >= window.from && dateKey <= window.to;
  }).length;

  return {
    ...emptySummary,
    points: completedSessions.reduce((sum, item) => sum + item.pointsAwarded, 0)
      + perfectDayItems.reduce((sum, item) => sum + item.pointsAwarded, 0),
    completedFocusSessions: completedSessions.length,
    perfectDays: perfectDayItems.length,
    earnedBadges,
  };
}
