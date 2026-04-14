import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { toDateKey } from '@plainlist/shared';
const getMock = vi.fn();
const putMock = vi.fn();
const clearMock = vi.fn();
vi.mock('@/shared/api/useApi', () => ({
    useApi: () => ({
        get: getMock,
        put: putMock,
    }),
}));
vi.mock('@/features/ai-review/model/useAiReviewStore', () => ({
    useAiReviewStore: () => ({
        clear: clearMock,
    }),
}));
import { useChecksStore } from './useChecksStore';
describe('useChecksStore', () => {
    beforeEach(() => {
        setActivePinia(createPinia());
        getMock.mockReset();
        putMock.mockReset();
        clearMock.mockReset();
    });
    it('updates today checks through the direct checks api', async () => {
        const store = useChecksStore();
        const todayKey = toDateKey(new Date());
        putMock.mockResolvedValue({ ok: true });
        await store.toggle(7, todayKey);
        expect(store.isChecked(7, todayKey)).toBe(true);
        expect(putMock).toHaveBeenCalledWith('/checks', { planId: 7, date: todayKey, done: true });
        expect(clearMock).toHaveBeenCalledTimes(1);
    });
    it('rejects past dates before optimistic updates or api calls', async () => {
        const store = useChecksStore();
        const past = new Date();
        past.setDate(past.getDate() - 1);
        const pastKey = toDateKey(past);
        await expect(store.toggle(7, pastKey)).rejects.toThrow('Past dates must use a makeup card');
        expect(store.isChecked(7, pastKey)).toBe(false);
        expect(putMock).not.toHaveBeenCalled();
        expect(clearMock).not.toHaveBeenCalled();
    });
});
