export const DEFAULT_FOCUS_MINUTES = 25;
export const DEFAULT_BREAK_MINUTES = 5;
export const DEFAULT_CYCLES = 4;
export const MIN_FOCUS_MINUTES = 5;
export const MAX_FOCUS_MINUTES = 60;
export const MIN_BREAK_MINUTES = 1;
export const MAX_BREAK_MINUTES = 30;
export const MIN_CYCLE_INTERVAL = 2;
export const MAX_CYCLE_INTERVAL = 8;

export const FOCUS_SESSION_POINTS = 10;
export const PERFECT_DAY_POINTS = 15;
export const FOCUS_SESSION_EXPERIENCE = 12;
export const PERFECT_DAY_EXPERIENCE = 18;
export const MAX_LEVEL = 10;
export const MAKEUP_CARD_COST = 120;

export const DEFAULT_FOCUS_TIMER_SETTINGS = {
  focusMinutes: DEFAULT_FOCUS_MINUTES,
  breakMinutes: DEFAULT_BREAK_MINUTES,
  cycles: DEFAULT_CYCLES,
} as const;

export const STORE_ITEM_DEFINITIONS = [
  {
    id: 'makeup-card',
    pointsCost: MAKEUP_CARD_COST,
  },
] as const;

export const REWARD_ACHIEVEMENT_DEFINITIONS = [
  // Category 1: Cumulative check-in badges (total check-in days)
  { id: 'checkin-3', category: 'checkin', metric: 'checkinDays', target: 3, nameKey: 'reward.achievement.checkin_3', conditionKey: 'reward.achievement.condition.checkin_days', descKey: 'reward.achievement.desc.checkin_3', icon: '/badges/checkin-3.png' },
  { id: 'checkin-15', category: 'checkin', metric: 'checkinDays', target: 15, nameKey: 'reward.achievement.checkin_15', conditionKey: 'reward.achievement.condition.checkin_days', descKey: 'reward.achievement.desc.checkin_15', icon: '/badges/checkin-15.png' },
  { id: 'checkin-50', category: 'checkin', metric: 'checkinDays', target: 50, nameKey: 'reward.achievement.checkin_50', conditionKey: 'reward.achievement.condition.checkin_days', descKey: 'reward.achievement.desc.checkin_50', icon: '/badges/checkin-50.png' },
  { id: 'checkin-120', category: 'checkin', metric: 'checkinDays', target: 120, nameKey: 'reward.achievement.checkin_120', conditionKey: 'reward.achievement.condition.checkin_days', descKey: 'reward.achievement.desc.checkin_120', icon: '/badges/checkin-120.png' },
  { id: 'checkin-300', category: 'checkin', metric: 'checkinDays', target: 300, nameKey: 'reward.achievement.checkin_300', conditionKey: 'reward.achievement.condition.checkin_days', descKey: 'reward.achievement.desc.checkin_300', icon: '/badges/checkin-300.png' },
  // Category 2: Consecutive check-in badges (streak days)
  { id: 'streak-3', category: 'streak', metric: 'streakDays', target: 3, nameKey: 'reward.achievement.streak_3', conditionKey: 'reward.achievement.condition.streak_days', descKey: 'reward.achievement.desc.streak_3', icon: '/badges/streak-3.png' },
  { id: 'streak-7', category: 'streak', metric: 'streakDays', target: 7, nameKey: 'reward.achievement.streak_7', conditionKey: 'reward.achievement.condition.streak_days', descKey: 'reward.achievement.desc.streak_7', icon: '/badges/streak-7.png' },
  { id: 'streak-15', category: 'streak', metric: 'streakDays', target: 15, nameKey: 'reward.achievement.streak_15', conditionKey: 'reward.achievement.condition.streak_days', descKey: 'reward.achievement.desc.streak_15', icon: '/badges/streak-15.png' },
  { id: 'streak-30', category: 'streak', metric: 'streakDays', target: 30, nameKey: 'reward.achievement.streak_30', conditionKey: 'reward.achievement.condition.streak_days', descKey: 'reward.achievement.desc.streak_30', icon: '/badges/streak-30.png' },
  { id: 'streak-100', category: 'streak', metric: 'streakDays', target: 100, nameKey: 'reward.achievement.streak_100', conditionKey: 'reward.achievement.condition.streak_days', descKey: 'reward.achievement.desc.streak_100', icon: '/badges/streak-100.png' },
  // Category 3: Focus session badges (cumulative pomodoro completions)
  { id: 'focus-5', category: 'focus', metric: 'focusSessions', target: 5, nameKey: 'reward.achievement.focus_5', conditionKey: 'reward.achievement.condition.focus_sessions', descKey: 'reward.achievement.desc.focus_5', icon: '/badges/focus-5.png' },
  { id: 'focus-25', category: 'focus', metric: 'focusSessions', target: 25, nameKey: 'reward.achievement.focus_25', conditionKey: 'reward.achievement.condition.focus_sessions', descKey: 'reward.achievement.desc.focus_25', icon: '/badges/focus-25.png' },
  { id: 'focus-80', category: 'focus', metric: 'focusSessions', target: 80, nameKey: 'reward.achievement.focus_80', conditionKey: 'reward.achievement.condition.focus_sessions', descKey: 'reward.achievement.desc.focus_80', icon: '/badges/focus-80.png' },
  { id: 'focus-180', category: 'focus', metric: 'focusSessions', target: 180, nameKey: 'reward.achievement.focus_180', conditionKey: 'reward.achievement.condition.focus_sessions', descKey: 'reward.achievement.desc.focus_180', icon: '/badges/focus-180.png' },
  { id: 'focus-400', category: 'focus', metric: 'focusSessions', target: 400, nameKey: 'reward.achievement.focus_400', conditionKey: 'reward.achievement.condition.focus_sessions', descKey: 'reward.achievement.desc.focus_400', icon: '/badges/focus-400.png' },
  // Category 4: Level milestone badges (key level thresholds)
  { id: 'level-2', category: 'level', metric: 'level', target: 2, nameKey: 'reward.achievement.level_2', conditionKey: 'reward.achievement.condition.level', descKey: 'reward.achievement.desc.level_2', icon: '/badges/level-2.png' },
  { id: 'level-4', category: 'level', metric: 'level', target: 4, nameKey: 'reward.achievement.level_4', conditionKey: 'reward.achievement.condition.level', descKey: 'reward.achievement.desc.level_4', icon: '/badges/level-4.png' },
  { id: 'level-6', category: 'level', metric: 'level', target: 6, nameKey: 'reward.achievement.level_6', conditionKey: 'reward.achievement.condition.level', descKey: 'reward.achievement.desc.level_6', icon: '/badges/level-6.png' },
  { id: 'level-8', category: 'level', metric: 'level', target: 8, nameKey: 'reward.achievement.level_8', conditionKey: 'reward.achievement.condition.level', descKey: 'reward.achievement.desc.level_8', icon: '/badges/level-8.png' },
  { id: 'level-10', category: 'level', metric: 'level', target: 10, nameKey: 'reward.achievement.level_10', conditionKey: 'reward.achievement.condition.level', descKey: 'reward.achievement.desc.level_10', icon: '/badges/level-10.png' },
] as const;

export const REWARD_BADGE_DEFINITIONS = REWARD_ACHIEVEMENT_DEFINITIONS;

/** Achievement category display order for the Achievement Wall */
export const ACHIEVEMENT_CATEGORIES = [
  { key: 'checkin', labelKey: 'reward.achievement.category.checkin' },
  { key: 'streak', labelKey: 'reward.achievement.category.streak' },
  { key: 'focus', labelKey: 'reward.achievement.category.focus' },
  { key: 'level', labelKey: 'reward.achievement.category.level' },
] as const;
