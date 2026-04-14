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
};
export const STORE_ITEM_DEFINITIONS = [
    {
        id: 'makeup-card',
        pointsCost: MAKEUP_CARD_COST,
    },
];
export const REWARD_ACHIEVEMENT_DEFINITIONS = [
    { id: 'checkin-3', category: 'checkin', metric: 'checkinDays', target: 3, nameKey: 'reward.achievement.checkin_3', conditionKey: 'reward.achievement.condition.checkin_days' },
    { id: 'checkin-15', category: 'checkin', metric: 'checkinDays', target: 15, nameKey: 'reward.achievement.checkin_15', conditionKey: 'reward.achievement.condition.checkin_days' },
    { id: 'checkin-50', category: 'checkin', metric: 'checkinDays', target: 50, nameKey: 'reward.achievement.checkin_50', conditionKey: 'reward.achievement.condition.checkin_days' },
    { id: 'checkin-120', category: 'checkin', metric: 'checkinDays', target: 120, nameKey: 'reward.achievement.checkin_120', conditionKey: 'reward.achievement.condition.checkin_days' },
    { id: 'checkin-300', category: 'checkin', metric: 'checkinDays', target: 300, nameKey: 'reward.achievement.checkin_300', conditionKey: 'reward.achievement.condition.checkin_days' },
    { id: 'streak-3', category: 'streak', metric: 'streakDays', target: 3, nameKey: 'reward.achievement.streak_3', conditionKey: 'reward.achievement.condition.streak_days' },
    { id: 'streak-7', category: 'streak', metric: 'streakDays', target: 7, nameKey: 'reward.achievement.streak_7', conditionKey: 'reward.achievement.condition.streak_days' },
    { id: 'streak-15', category: 'streak', metric: 'streakDays', target: 15, nameKey: 'reward.achievement.streak_15', conditionKey: 'reward.achievement.condition.streak_days' },
    { id: 'streak-30', category: 'streak', metric: 'streakDays', target: 30, nameKey: 'reward.achievement.streak_30', conditionKey: 'reward.achievement.condition.streak_days' },
    { id: 'streak-100', category: 'streak', metric: 'streakDays', target: 100, nameKey: 'reward.achievement.streak_100', conditionKey: 'reward.achievement.condition.streak_days' },
    { id: 'focus-5', category: 'focus', metric: 'focusSessions', target: 5, nameKey: 'reward.achievement.focus_5', conditionKey: 'reward.achievement.condition.focus_sessions' },
    { id: 'focus-25', category: 'focus', metric: 'focusSessions', target: 25, nameKey: 'reward.achievement.focus_25', conditionKey: 'reward.achievement.condition.focus_sessions' },
    { id: 'focus-80', category: 'focus', metric: 'focusSessions', target: 80, nameKey: 'reward.achievement.focus_80', conditionKey: 'reward.achievement.condition.focus_sessions' },
    { id: 'focus-180', category: 'focus', metric: 'focusSessions', target: 180, nameKey: 'reward.achievement.focus_180', conditionKey: 'reward.achievement.condition.focus_sessions' },
    { id: 'focus-400', category: 'focus', metric: 'focusSessions', target: 400, nameKey: 'reward.achievement.focus_400', conditionKey: 'reward.achievement.condition.focus_sessions' },
    { id: 'level-2', category: 'level', metric: 'level', target: 2, nameKey: 'reward.achievement.level_2', conditionKey: 'reward.achievement.condition.level' },
    { id: 'level-4', category: 'level', metric: 'level', target: 4, nameKey: 'reward.achievement.level_4', conditionKey: 'reward.achievement.condition.level' },
    { id: 'level-6', category: 'level', metric: 'level', target: 6, nameKey: 'reward.achievement.level_6', conditionKey: 'reward.achievement.condition.level' },
    { id: 'level-8', category: 'level', metric: 'level', target: 8, nameKey: 'reward.achievement.level_8', conditionKey: 'reward.achievement.condition.level' },
    { id: 'level-10', category: 'level', metric: 'level', target: 10, nameKey: 'reward.achievement.level_10', conditionKey: 'reward.achievement.condition.level' },
];
export const REWARD_BADGE_DEFINITIONS = REWARD_ACHIEVEMENT_DEFINITIONS;
