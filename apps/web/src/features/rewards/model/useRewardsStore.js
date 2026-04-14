import { defineStore } from 'pinia';
import { reactive, ref } from 'vue';
import { useApi } from '@/shared/api/useApi';
export const useRewardsStore = defineStore('rewards', () => {
    const { get, post } = useApi();
    const overview = ref(null);
    const loading = ref(false);
    const periodLoading = ref(false);
    const actionLoading = ref(false);
    const error = ref('');
    const periodError = ref('');
    const actionError = ref('');
    const periods = reactive({});
    async function fetchOverview() {
        loading.value = true;
        error.value = '';
        try {
            overview.value = await get('/rewards/overview');
            return overview.value;
        }
        catch (caughtError) {
            error.value = caughtError instanceof Error ? caughtError.message : 'Failed to load rewards';
            throw caughtError;
        }
        finally {
            loading.value = false;
        }
    }
    function periodKey(period, referenceDate) {
        return `${period}:${referenceDate}`;
    }
    async function fetchPeriod(period, referenceDate, force = false) {
        const key = periodKey(period, referenceDate);
        if (!force && periods[key]) {
            return periods[key];
        }
        periodLoading.value = true;
        periodError.value = '';
        try {
            const summary = await get(`/rewards/period?period=${period}&referenceDate=${referenceDate}`);
            periods[key] = summary;
            return summary;
        }
        catch (caughtError) {
            periodError.value = caughtError instanceof Error ? caughtError.message : 'Failed to load reward period';
            throw caughtError;
        }
        finally {
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
            await fetchPeriod(period, referenceDate, true);
        }
    }
    async function purchaseItem(itemId, quantity = 1) {
        actionLoading.value = true;
        actionError.value = '';
        try {
            await post('/rewards/store/purchase', { itemId, quantity });
            await Promise.all([fetchOverview(), reloadCachedPeriods()]);
        }
        catch (caughtError) {
            actionError.value = caughtError instanceof Error ? caughtError.message : 'Failed to purchase item';
            throw caughtError;
        }
        finally {
            actionLoading.value = false;
        }
    }
    async function useMakeupCard(planId, date) {
        actionLoading.value = true;
        actionError.value = '';
        try {
            await post('/rewards/makeup-cards/use', { planId, date });
            await Promise.all([fetchOverview(), reloadCachedPeriods()]);
        }
        catch (caughtError) {
            actionError.value = caughtError instanceof Error ? caughtError.message : 'Failed to use makeup card';
            throw caughtError;
        }
        finally {
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
