import { describe, expect, it } from 'vitest';
import { toDateKey } from '@plainlist/shared';
import { assertDirectCheckDateAllowed, assertDirectChecksBatchDatesAllowed } from './service';

describe('checks service date guard', () => {
  it('allows direct updates for today', () => {
    const todayKey = toDateKey(new Date());

    expect(() => assertDirectCheckDateAllowed(todayKey)).not.toThrow();
  });

  it('rejects direct updates for past dates', () => {
    const past = new Date();
    past.setDate(past.getDate() - 1);
    const pastKey = toDateKey(past);

    expect(() => assertDirectCheckDateAllowed(pastKey)).toThrow('past dates must use a makeup card');
  });

  it('rejects batch direct updates when any date is in the past', () => {
    const todayKey = toDateKey(new Date());
    const past = new Date();
    past.setDate(past.getDate() - 1);
    const pastKey = toDateKey(past);

    expect(() => assertDirectChecksBatchDatesAllowed([todayKey, pastKey])).toThrow('past dates must use a makeup card');
  });
});
