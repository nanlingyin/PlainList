import type { AiReviewPeriod, RewardOverview, RewardPeriodSummary, StoreItemId } from '@plainlist/shared';
import { defineStore } from 'pinia';
import { reactive, ref } from 'vue';
import { useApi } from '@/shared/api/useApi';

export const useRewardsStore = defineStore('rewards', () => {
  const { get, post } = useApi();
  const overview = ref<RewardOverview | null>(null);
  const loading = ref(false);
  const periodLoading = ref(false);
  const actionLoading = ref(false);
  const error = ref('');
  const periodError = ref('');
  const actionError = ref('');
  const periods = reactive<Record<string, RewardPeriodSummary>>({});

  async function fetchOverview() {
    loading.value = true;
    error.value = '';

    try {
      overview.value = await get<RewardOverview>('/rewards/overview');
      return overview.value;
    } catch (caughtError) {
      error.value = caughtError instanceof Error ? caughtError.message : 'Failed to load rewards';
      throw caughtError;
    } finally {
      loading.value = false;
    }
  }

  function periodKey(period: AiReviewPeriod, referenceDate: string) {
    return `${period}:${referenceDate}`;
  }

  async function fetchPeriod(period: AiReviewPeriod, referenceDate: string, force = false) {
    const key = periodKey(period, referenceDate);
    if (!force && periods[key]) {
      return periods[key];
    }

    periodLoading.value = true;
    periodError.value = '';

    try {
      const summary = await get<RewardPeriodSummary>(`/rewards/period?period=${period}&referenceDate=${referenceDate}`);
      periods[key] = summary;
      return summary;
    } catch (caughtError) {
      periodError.value = caughtError instanceof Error ? caughtError.message : 'Failed to load reward period';
      throw caughtError;
    } finally {
      periodLoading.value = false;
    }
  }

  async function reloadCachedPeriods() {
    const entries = Object.keys(periods);
    for (const entry of entries) {
      const [period, referenceDate] = entry.split(':');
      if (!period || !referenceDate) {
        continue;
      }
      await fetchPeriod(period as AiReviewPeriod, referenceDate, true);
    }
  }

  async function purchaseItem(itemId: StoreItemId, quantity = 1) {
    actionLoading.value = true;
    actionError.value = '';

    try {
      await post<{ ok: true }>('/rewards/store/purchase', { itemId, quantity });
      await Promise.all([fetchOverview(), reloadCachedPeriods()]);
    } catch (caughtError) {
      actionError.value = caughtError instanceof Error ? caughtError.message : 'Failed to purchase item';
      throw caughtError;
    } finally {
      actionLoading.value = false;
    }
  }

  async function useMakeupCard(planId: number, date: string) {
    actionLoading.value = true;
    actionError.value = '';

    try {
      await post<{ ok: true }>('/rewards/makeup-cards/use', { planId, date });
      await Promise.all([fetchOverview(), reloadCachedPeriods()]);
    } catch (caughtError) {
      actionError.value = caughtError instanceof Error ? caughtError.message : 'Failed to use makeup card';
      throw caughtError;
    } finally {
      actionLoading.value = false;
    }
  }

  function clear() {
    overview.value = null;
    error.value = '';
    periodError.value = '';
    actionError.value = '';
    loading.value = false;
    periodLoading.value = false;
    actionLoading.value = false;
    Object.keys(periods).forEach((key) => {
      delete periods[key];
    });
  }

  return {
    overview,
    periods,
    loading,
    periodLoading,
    actionLoading,
    error,
    periodError,
    actionError,
    fetchOverview,
    fetchPeriod,
    reloadCachedPeriods,
    purchaseItem,
    useMakeupCard,
    clear,
  };
});
