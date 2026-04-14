import type { ChecksByPlan } from '@plainlist/shared';
import { getMonthRange, toDateKey } from '@plainlist/shared';
import { defineStore } from 'pinia';
import { ref } from 'vue';
import { useAiReviewStore } from '@/features/ai-review/model/useAiReviewStore';
import { useApi } from '@/shared/api/useApi';

export const useChecksStore = defineStore('checks', () => {
  const { get, put } = useApi();
  const aiReview = useAiReviewStore();
  const checks = ref<ChecksByPlan>({});

  async function fetchRange(from: string, to: string) {
    const rows = await get<ChecksByPlan>(`/checks?from=${from}&to=${to}`);
    Object.keys(rows).forEach((planId) => {
      if (!checks.value[planId]) {
        checks.value[planId] = {};
      }

      Object.assign(checks.value[planId], rows[planId]);
    });
  }

  async function fetchMonth(year: number, month: number) {
    const range = getMonthRange(year, month - 1);
    await fetchRange(range.from, range.to);
  }

  function isChecked(planId: number | string, dateKey: string) {
    return Boolean(checks.value[String(planId)]?.[dateKey]);
  }

  function isPastDate(dateKey: string) {
    return dateKey < toDateKey(new Date());
  }

  async function toggle(planId: number, dateKey: string) {
    if (isPastDate(dateKey)) {
      throw new Error('Past dates must use a makeup card');
    }

    const planKey = String(planId);
    const current = isChecked(planKey, dateKey);
    const next = !current;

    if (!checks.value[planKey]) {
      checks.value[planKey] = {};
    }

    checks.value[planKey][dateKey] = next;

    try {
      await put<{ ok: true }>('/checks', { planId, date: dateKey, done: next });
      aiReview.clear();
    } catch (error) {
      checks.value[planKey][dateKey] = current;
      throw error;
    }
  }

  function clear() {
    checks.value = {};
    aiReview.clear();
  }

  return {
    checks,
    fetchRange,
    fetchMonth,
    isChecked,
    toggle,
    clear,
  };
});
