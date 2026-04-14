export type PlanType = 'habit' | 'todo';
export type PluginCategory = 'language' | 'theme' | 'feature';
export type ThemeVars = Record<string, string>;
export type FocusSessionStatus = 'active' | 'paused' | 'completed' | 'canceled';
export type RewardBadgeId = 'first-focus' | 'focus-8' | 'focus-25' | 'perfect-day-1' | 'streak-3' | 'streak-7';
export type RewardBadgeMetric = 'focusSessions' | 'perfectDays' | 'streak';
export type RewardEventKind = 'focus-session' | 'perfect-day';
export type StoreItemId = 'makeup-card';

export interface AuthenticatedUser {
  id: number;
  username: string;
  isAdmin: boolean;
}

export interface AuthAccount {
  username: string;
  isAdmin: boolean;
}

export interface AuthSuccessResponse {
  token: string;
  username: string;
  isAdmin: boolean;
}

export interface PlanRecord {
  id: number;
  type: PlanType;
  name: string;
  time: string;
  sortOrder: number;
}

export type ChecksByPlan = Record<string, Record<string, boolean>>;

export interface FocusSessionRecord {
  id: number;
  status: FocusSessionStatus;
  planId: number | null;
  planName: string | null;
  startedAt: string;
  endedAt: string | null;
  pausedAt: string | null;
  focusMinutes: number;
  breakMinutes: number;
  cycleInterval: number;
  accumulatedPauseSeconds: number;
  pointsAwarded: number;
  experienceAwarded: number;
}

export interface FocusTimerSettings {
  focusMinutes: number;
  shortBreakMinutes: number;
  longBreakMinutes: number;
  cyclesBeforeLongBreak: number;
}

export type AiReviewPeriod = 'day' | 'week' | 'month' | 'year';

export interface AiReviewPlanSummary {
  id: number;
  name: string;
  type: PlanType;
  completedDays: number;
  expectedDays: number;
  completionRate: number;
}

export interface AiReviewDaySummary {
  date: string;
  completedChecks: number;
  expectedChecks: number;
  completionRate: number;
}

export interface AiReviewSummary {
  period: AiReviewPeriod;
  periodLabel: string;
  referenceDate: string;
  from: string;
  to: string;
  totalPlans: number;
  habitCount: number;
  todoCount: number;
  activeDays: number;
  expectedChecks: number;
  completedChecks: number;
  completionRate: number;
  perfectDays: number;
  perfectDayRate: number;
  currentPerfectStreak: number;
  longestPerfectStreak: number;
  bestPlans: AiReviewPlanSummary[];
  weakestPlans: AiReviewPlanSummary[];
  mostMissedDays: AiReviewDaySummary[];
}

export interface AiReviewResponse {
  period: AiReviewPeriod;
  review: string;
  model: string;
  source: 'ai' | 'fallback';
  generatedAt: string;
  summary: AiReviewSummary;
}

export interface InstalledPlugin {
  id: string;
  enabled: boolean;
  installedAt: string;
}

export interface PluginTranslationBundle {
  messages?: Record<string, string>;
  lists?: Record<string, string[]>;
}

export interface ThemeDefinition {
  id: string;
  name: string;
  vars: ThemeVars;
}

export interface PluginManifest {
  id: string;
  name: string;
  version: string;
  category: PluginCategory;
  author: string;
  description: string;
  longDescription?: string;
  features?: string[];
  themes?: ThemeDefinition[];
  translation?: PluginTranslationBundle;
  runtime: 'manifest';
}

export interface RewardBadgeProgress {
  id: RewardBadgeId;
  metric: RewardBadgeMetric;
  target: number;
  progress: number;
  earned: boolean;
  achievedAt: string | null;
}

export interface RewardEvent {
  id: string;
  kind: RewardEventKind;
  occurredAt: string;
  points: number;
  experience: number;
  date: string;
  planId?: number | null;
  planName?: string | null;
}

export interface RewardPeriodSummary {
  period: AiReviewPeriod;
  periodLabel: string;
  referenceDate: string;
  from: string;
  to: string;
  points: number;
  completedFocusSessions: number;
  perfectDays: number;
  earnedBadges: number;
}

export interface RewardOverview {
  totalPoints: number;
  spendablePoints: number;
  totalPointsSpent: number;
  totalExperience: number;
  level: number;
  currentLevelExperience: number;
  nextLevelExperience: number | null;
  todayPoints: number;
  completedFocusSessions: number;
  completedFocusSessionsToday: number;
  perfectDays: number;
  perfectDaysToday: number;
  currentPerfectStreak: number;
  longestPerfectStreak: number;
  badges: RewardBadgeProgress[];
  recentEvents: RewardEvent[];
  inventory: RewardInventoryItem[];
  storeItems: RewardStoreItem[];
}

export interface RewardInventoryItem {
  itemId: StoreItemId;
  quantity: number;
}

export interface RewardStoreItem {
  itemId: StoreItemId;
  pointsCost: number;
  ownedQuantity: number;
}

export interface FocusTreeRecord {
  sessionId: number;
  plantedAt: string;
  focusMinutes: number;
  breakMinutes: number;
  cycleInterval: number;
  pointsAwarded: number;
  experienceAwarded: number;
  planId: number | null;
  planName: string | null;
}
