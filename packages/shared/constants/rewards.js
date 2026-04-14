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
export const REWARD_BADGE_DEFINITIONS = [
    { id: 'first-focus', metric: 'focusSessions', target: 1 },
    { id: 'focus-8', metric: 'focusSessions', target: 8 },
    { id: 'focus-25', metric: 'focusSessions', target: 25 },
    { id: 'perfect-day-1', metric: 'perfectDays', target: 1 },
    { id: 'streak-3', metric: 'streak', target: 3 },
    { id: 'streak-7', metric: 'streak', target: 7 },
];
