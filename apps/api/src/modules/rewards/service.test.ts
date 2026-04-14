import { describe, expect, it } from 'vitest';
import { buildRewardModel, buildRewardOverview, buildRewardPeriodSummary, calculateFocusReward, getLevelProgress } from './logic';

describe('reward logic', () => {
  it('derives points, recent events, and achievements from focus sessions and check-in days', () => {
    const model = buildRewardModel(
      [
        { id: 1, createdAt: '2026-04-01T00:00:00.000Z' },
      ],
      [
        { planId: 1, date: '2026-04-01', done: true },
        { planId: 1, date: '2026-04-02', done: true },
        { planId: 1, date: '2026-04-03', done: true },
      ],
      [
        {
          id: 11,
          planId: 1,
          planName: 'Deep work',
          startedAt: '2026-04-01T01:00:00.000Z',
          endedAt: '2026-04-01T01:25:00.000Z',
          focusMinutes: 25,
          breakMinutes: 5,
          cycleInterval: 4,
          pointsAwarded: 10,
          experienceAwarded: 12,
        },
        {
          id: 12,
          planId: 1,
          planName: 'Deep work',
          startedAt: '2026-04-02T01:00:00.000Z',
          endedAt: '2026-04-02T01:25:00.000Z',
          focusMinutes: 25,
          breakMinutes: 5,
          cycleInterval: 4,
          pointsAwarded: 10,
          experienceAwarded: 12,
        },
      ],
      [],
      [],
      '2026-04-03',
    );

    const overview = buildRewardOverview(model);
    expect(overview.totalPoints).toBe(65);
    expect(overview.spendablePoints).toBe(65);
    expect(overview.completedFocusSessions).toBe(2);
    expect(overview.perfectDays).toBe(3);
    expect(overview.longestPerfectStreak).toBe(3);
    expect(overview.level).toBeGreaterThanOrEqual(1);
    expect(overview.achievements.find((achievement) => achievement.id === 'checkin-3')?.earned).toBe(true);
    expect(overview.achievements.find((achievement) => achievement.id === 'streak-3')?.earned).toBe(true);
    expect(overview.achievements.find((achievement) => achievement.id === 'focus-5')?.earned).toBe(false);
    expect(overview.badges).toHaveLength(overview.achievements.length);
    expect(overview.recentEvents[0]?.kind).toBe('perfect-day');
  });

  it('summarizes rewards for a selected month window', () => {
    const model = buildRewardModel(
      [{ id: 1, createdAt: '2026-03-25T00:00:00.000Z' }],
      [
        { planId: 1, date: '2026-03-30', done: true },
        { planId: 1, date: '2026-04-01', done: true },
        { planId: 1, date: '2026-04-02', done: false },
      ],
      [
        {
          id: 21,
          planId: null,
          planName: null,
          startedAt: '2026-03-30T10:00:00.000Z',
          endedAt: '2026-03-30T10:25:00.000Z',
          focusMinutes: 25,
          breakMinutes: 5,
          cycleInterval: 4,
          pointsAwarded: 10,
          experienceAwarded: 12,
        },
        {
          id: 22,
          planId: null,
          planName: null,
          startedAt: '2026-04-01T10:00:00.000Z',
          endedAt: '2026-04-01T10:25:00.000Z',
          focusMinutes: 25,
          breakMinutes: 5,
          cycleInterval: 4,
          pointsAwarded: 10,
          experienceAwarded: 12,
        },
      ],
      [],
      [],
      '2026-04-14',
    );

    const summary = buildRewardPeriodSummary(model, 'month', '2026-04-14');
    expect(summary.from).toBe('2026-04-01');
    expect(summary.completedFocusSessions).toBe(1);
    expect(summary.perfectDays).toBe(1);
    expect(summary.points).toBe(25);
    expect(summary.earnedAchievements).toBe(0);
    expect(summary.earnedBadges).toBe(summary.earnedAchievements);
  });

  it('tracks check-in day achievements separately from perfect-day streaks', () => {
    const model = buildRewardModel(
      [
        { id: 1, createdAt: '2026-04-01T00:00:00.000Z' },
        { id: 2, createdAt: '2026-04-01T00:00:00.000Z' },
      ],
      [
        { planId: 1, date: '2026-04-01', done: true },
        { planId: 2, date: '2026-04-01', done: false },
        { planId: 1, date: '2026-04-02', done: true },
        { planId: 2, date: '2026-04-02', done: false },
        { planId: 1, date: '2026-04-03', done: true },
        { planId: 2, date: '2026-04-03', done: false },
      ],
      [],
      [],
      [],
      '2026-04-03',
    );

    const overview = buildRewardOverview(model);
    expect(model.checkinDays).toBe(3);
    expect(model.longestCheckinStreak).toBe(3);
    expect(overview.perfectDays).toBe(0);
    expect(overview.currentPerfectStreak).toBe(0);
    expect(overview.achievements.find((achievement) => achievement.id === 'checkin-3')?.earned).toBe(true);
    expect(overview.achievements.find((achievement) => achievement.id === 'streak-3')?.earned).toBe(true);
  });

  it('unlocks level achievements and counts them inside period summaries', () => {
    const model = buildRewardModel(
      [{ id: 1, createdAt: '2026-04-01T00:00:00.000Z' }],
      [{ planId: 1, date: '2026-04-02', done: true }],
      [
        {
          id: 31,
          planId: null,
          planName: null,
          startedAt: '2026-04-02T08:00:00.000Z',
          endedAt: '2026-04-02T09:00:00.000Z',
          focusMinutes: 60,
          breakMinutes: 5,
          cycleInterval: 8,
          pointsAwarded: 29,
          experienceAwarded: 110,
        },
      ],
      [],
      [],
      '2026-04-14',
    );

    const overview = buildRewardOverview(model);
    expect(overview.level).toBeGreaterThanOrEqual(2);
    expect(overview.achievements.find((achievement) => achievement.id === 'level-2')?.earned).toBe(true);

    const summary = buildRewardPeriodSummary(model, 'month', '2026-04-14');
    expect(summary.earnedAchievements).toBeGreaterThanOrEqual(1);
    expect(summary.earnedBadges).toBe(summary.earnedAchievements);
  });

  it('scales reward output with harder focus settings and caps levels at ten', () => {
    const shortSession = calculateFocusReward(25, 4);
    const longSession = calculateFocusReward(50, 6);

    expect(longSession.points).toBeGreaterThan(shortSession.points);
    expect(longSession.experience).toBeGreaterThan(shortSession.experience);

    const levelInfo = getLevelProgress(5000);
    expect(levelInfo.level).toBe(10);
    expect(levelInfo.nextLevelExperience).toBeNull();
  });
});
