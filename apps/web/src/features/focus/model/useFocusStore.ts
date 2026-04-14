import type { FocusSessionRecord, FocusTimerSettings } from '@plainlist/shared';
import {
  DEFAULT_FOCUS_TIMER_SETTINGS,
  DEFAULT_SHORT_BREAK_MINUTES,
} from '@plainlist/shared';
import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import { useRewardsStore } from '@/features/rewards/model/useRewardsStore';
import { useApi } from '@/shared/api/useApi';

type FocusPhase = 'focus' | 'break';

type StoredBreakState = {
  phase: 'break';
  running: boolean;
  remainingSeconds: number;
  breakMinutes: number;
  chainCount: number;
  endsAt: string | null;
};

const STORAGE_KEY = 'plainlist-focus-state';

export const useFocusStore = defineStore('focus', () => {
  const { get, post, put } = useApi();
  const rewards = useRewardsStore();

  const activeSession = ref<FocusSessionRecord | null>(null);
  const recentSessions = ref<FocusSessionRecord[]>([]);
  const forestSessions = ref<FocusSessionRecord[]>([]);
  const settings = ref<FocusTimerSettings>({ ...DEFAULT_FOCUS_TIMER_SETTINGS });
  const phase = ref<FocusPhase>('focus');
  const running = ref(false);
  const remainingSeconds = ref(0);
  const breakMinutes = ref(DEFAULT_SHORT_BREAK_MINUTES);
  const chainCount = ref(0);
  const loading = ref(false);
  const error = ref('');
  const hydrated = ref(false);
  const endedAtIso = ref<string | null>(null);

  let timerHandle: number | null = null;
  let completing = false;

  const mode = computed<'idle' | FocusPhase>(() => {
    if (phase.value === 'break' && (running.value || remainingSeconds.value > 0)) {
      return 'break';
    }

    if (activeSession.value) {
      return 'focus';
    }

    return 'idle';
  });

  function persistBreakState() {
    if (typeof window === 'undefined') {
      return;
    }

    if (phase.value === 'break' && (running.value || remainingSeconds.value > 0)) {
      const payload: StoredBreakState = {
        phase: 'break',
        running: running.value,
        remainingSeconds: remainingSeconds.value,
        breakMinutes: breakMinutes.value,
        chainCount: chainCount.value,
        endsAt: endedAtIso.value,
      };
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
      return;
    }

    window.localStorage.removeItem(STORAGE_KEY);
  }

  function stopTicker() {
    if (timerHandle !== null) {
      window.clearInterval(timerHandle);
      timerHandle = null;
    }
  }

  function clearBreakState() {
    stopTicker();
    phase.value = 'focus';
    running.value = false;
    remainingSeconds.value = 0;
    breakMinutes.value = settings.value.shortBreakMinutes;
    endedAtIso.value = null;
    persistBreakState();
  }

  async function loadSettings() {
    settings.value = await get<FocusTimerSettings>('/focus-sessions/settings');
    if (phase.value === 'focus' && !activeSession.value) {
      breakMinutes.value = settings.value.shortBreakMinutes;
    }
    return settings.value;
  }

  async function saveSettings(nextSettings: FocusTimerSettings) {
    settings.value = await put<FocusTimerSettings>('/focus-sessions/settings', nextSettings);
    if (phase.value === 'focus' && !activeSession.value) {
      breakMinutes.value = settings.value.shortBreakMinutes;
    }
    return settings.value;
  }

  async function loadRecent() {
    recentSessions.value = await get<FocusSessionRecord[]>('/focus-sessions?limit=6');
    return recentSessions.value;
  }

  async function loadForest(limit = 160) {
    forestSessions.value = await get<FocusSessionRecord[]>(`/focus-sessions?status=completed&limit=${limit}`);
    return forestSessions.value;
  }

  async function onTimerReachedZero() {
    if (completing) {
      return;
    }

    if (phase.value === 'break') {
      clearBreakState();
      return;
    }

    if (!activeSession.value) {
      return;
    }

    completing = true;
    try {
      const sessionId = activeSession.value.id;
      const completedSession = await post<FocusSessionRecord>(`/focus-sessions/${sessionId}/complete`);
      const completedBreak = (chainCount.value + 1) % settings.value.cyclesBeforeLongBreak === 0
        ? settings.value.longBreakMinutes
        : settings.value.shortBreakMinutes;
      chainCount.value += 1;
      activeSession.value = null;
      phase.value = 'break';
      breakMinutes.value = completedBreak;
      remainingSeconds.value = completedBreak * 60;
      running.value = true;
      endedAtIso.value = new Date(Date.now() + remainingSeconds.value * 1000).toISOString();
      recentSessions.value = [completedSession, ...recentSessions.value].slice(0, 6);
      forestSessions.value = [completedSession, ...forestSessions.value];
      persistBreakState();
      startTicker();
      await Promise.all([
        rewards.fetchOverview(),
        rewards.reloadCachedPeriods(),
      ]);
    } catch (caughtError) {
      error.value = caughtError instanceof Error ? caughtError.message : 'Failed to complete focus session';
      running.value = false;
      endedAtIso.value = null;
    } finally {
      completing = false;
    }
  }

  function startTicker() {
    stopTicker();
    if (typeof window === 'undefined' || !running.value) {
      return;
    }

    timerHandle = window.setInterval(async () => {
      if (!endedAtIso.value) {
        return;
      }

      const diff = Math.max(0, Math.round((new Date(endedAtIso.value).getTime() - Date.now()) / 1000));
      remainingSeconds.value = diff;

      if (diff <= 0) {
        stopTicker();
        endedAtIso.value = null;
        await onTimerReachedZero();
      }
    }, 500);
  }

  function calculateRemainingForSession(session: FocusSessionRecord): number {
    const startedAt = new Date(session.startedAt).getTime();
    const pausedAt = session.pausedAt ? new Date(session.pausedAt).getTime() : null;
    const baseEnd = (pausedAt ?? Date.now()) - startedAt - session.accumulatedPauseSeconds * 1000;
    return Math.max(0, session.focusMinutes * 60 - Math.round(baseEnd / 1000));
  }

  function restoreStoredBreak() {
    if (typeof window === 'undefined') {
      return;
    }

    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return;
    }

    try {
      const stored = JSON.parse(raw) as StoredBreakState;
      if (stored.phase !== 'break') {
        window.localStorage.removeItem(STORAGE_KEY);
        return;
      }

      phase.value = 'break';
      breakMinutes.value = stored.breakMinutes;
      chainCount.value = stored.chainCount;
      running.value = stored.running;
      endedAtIso.value = stored.endsAt;

      if (stored.running && stored.endsAt) {
        remainingSeconds.value = Math.max(0, Math.round((new Date(stored.endsAt).getTime() - Date.now()) / 1000));
        if (remainingSeconds.value <= 0) {
          clearBreakState();
          return;
        }
      } else {
        remainingSeconds.value = stored.remainingSeconds;
      }

      persistBreakState();
      startTicker();
    } catch {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  }

  async function hydrate() {
    if (hydrated.value) {
      return;
    }

    hydrated.value = true;
    loading.value = true;
    error.value = '';

    try {
      const [savedSettings, active, recent] = await Promise.all([
        loadSettings(),
        get<FocusSessionRecord | null>('/focus-sessions/active'),
        get<FocusSessionRecord[]>('/focus-sessions?limit=6'),
      ]);

      settings.value = savedSettings;
      recentSessions.value = recent;

      if (active) {
        activeSession.value = active;
        phase.value = 'focus';
        breakMinutes.value = active.breakMinutes;
        remainingSeconds.value = calculateRemainingForSession(active);

        if (active.status === 'active' && remainingSeconds.value > 0) {
          running.value = true;
          endedAtIso.value = new Date(Date.now() + remainingSeconds.value * 1000).toISOString();
          startTicker();
        } else if (active.status === 'paused') {
          running.value = false;
          endedAtIso.value = null;
        } else if (remainingSeconds.value <= 0 && active.status === 'active') {
          await onTimerReachedZero();
        }
      } else {
        restoreStoredBreak();
      }
    } catch (caughtError) {
      error.value = caughtError instanceof Error ? caughtError.message : 'Failed to load focus timer';
    } finally {
      loading.value = false;
    }
  }

  async function start(planId?: number | null) {
    if (activeSession.value) {
      return activeSession.value;
    }

    loading.value = true;
    error.value = '';
    clearBreakState();

    try {
      const session = await post<FocusSessionRecord>('/focus-sessions/start', {
        planId: planId ?? undefined,
        focusMinutes: settings.value.focusMinutes,
        breakMinutes: settings.value.shortBreakMinutes,
        cycleInterval: settings.value.cyclesBeforeLongBreak,
      });
      activeSession.value = session;
      phase.value = 'focus';
      breakMinutes.value = session.breakMinutes;
      remainingSeconds.value = session.focusMinutes * 60;
      running.value = true;
      endedAtIso.value = new Date(Date.now() + remainingSeconds.value * 1000).toISOString();
      startTicker();
      await loadRecent();
      return session;
    } catch (caughtError) {
      error.value = caughtError instanceof Error ? caughtError.message : 'Failed to start focus session';
      throw caughtError;
    } finally {
      loading.value = false;
    }
  }

  async function pause() {
    if (phase.value === 'break') {
      if (!running.value) {
        return;
      }

      if (endedAtIso.value) {
        remainingSeconds.value = Math.max(0, Math.round((new Date(endedAtIso.value).getTime() - Date.now()) / 1000));
      }
      running.value = false;
      endedAtIso.value = null;
      stopTicker();
      persistBreakState();
      return;
    }

    if (!activeSession.value || phase.value !== 'focus' || !running.value) {
      return;
    }

    loading.value = true;
    error.value = '';

    try {
      activeSession.value = await post<FocusSessionRecord>(`/focus-sessions/${activeSession.value.id}/pause`);
      if (endedAtIso.value) {
        remainingSeconds.value = Math.max(0, Math.round((new Date(endedAtIso.value).getTime() - Date.now()) / 1000));
      }
      running.value = false;
      endedAtIso.value = null;
      stopTicker();
      persistBreakState();
    } catch (caughtError) {
      error.value = caughtError instanceof Error ? caughtError.message : 'Failed to pause focus session';
      throw caughtError;
    } finally {
      loading.value = false;
    }
  }

  async function resume() {
    if (phase.value === 'break') {
      if (running.value || remainingSeconds.value <= 0) {
        return;
      }

      running.value = true;
      endedAtIso.value = new Date(Date.now() + remainingSeconds.value * 1000).toISOString();
      persistBreakState();
      startTicker();
      return;
    }

    if (!activeSession.value || phase.value !== 'focus' || running.value) {
      return;
    }

    loading.value = true;
    error.value = '';

    try {
      activeSession.value = await post<FocusSessionRecord>(`/focus-sessions/${activeSession.value.id}/resume`);
      running.value = true;
      endedAtIso.value = new Date(Date.now() + remainingSeconds.value * 1000).toISOString();
      persistBreakState();
      startTicker();
    } catch (caughtError) {
      error.value = caughtError instanceof Error ? caughtError.message : 'Failed to resume focus session';
      throw caughtError;
    } finally {
      loading.value = false;
    }
  }

  async function cancel() {
    error.value = '';

    if (phase.value === 'break') {
      clearBreakState();
      return;
    }

    if (!activeSession.value) {
      return;
    }

    loading.value = true;
    try {
      await post<FocusSessionRecord>(`/focus-sessions/${activeSession.value.id}/cancel`);
      activeSession.value = null;
      running.value = false;
      remainingSeconds.value = 0;
      endedAtIso.value = null;
      stopTicker();
      await loadRecent();
    } catch (caughtError) {
      error.value = caughtError instanceof Error ? caughtError.message : 'Failed to cancel focus session';
      throw caughtError;
    } finally {
      loading.value = false;
    }
  }

  function skipBreak() {
    if (phase.value !== 'break') {
      return;
    }

    clearBreakState();
  }

  function clear() {
    stopTicker();
    activeSession.value = null;
    recentSessions.value = [];
    forestSessions.value = [];
    settings.value = { ...DEFAULT_FOCUS_TIMER_SETTINGS };
    phase.value = 'focus';
    running.value = false;
    remainingSeconds.value = 0;
    breakMinutes.value = DEFAULT_SHORT_BREAK_MINUTES;
    chainCount.value = 0;
    loading.value = false;
    error.value = '';
    hydrated.value = false;
    endedAtIso.value = null;
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  }

  return {
    activeSession,
    recentSessions,
    forestSessions,
    settings,
    phase,
    mode,
    running,
    remainingSeconds,
    breakMinutes,
    chainCount,
    loading,
    error,
    hydrate,
    loadRecent,
    loadForest,
    loadSettings,
    saveSettings,
    start,
    pause,
    resume,
    cancel,
    skipBreak,
    clear,
  };
});
