import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { AuthenticatedUser } from '@plainlist/shared';

const { queryMock } = vi.hoisted(() => ({
  queryMock: vi.fn(),
}));

vi.mock('../../db/pool', () => ({
  pool: {
    query: queryMock,
  },
}));

import { USER_SETTING_KEYS } from '@plainlist/shared';
import { getFocusTimerSettings, saveFocusTimerSettings } from './service';

const user: AuthenticatedUser = {
  id: 7,
  username: 'tester',
  isAdmin: false,
};

describe('focus session settings service', () => {
  beforeEach(() => {
    queryMock.mockReset();
  });

  it('maps legacy focus timer settings into the current shape', async () => {
    queryMock.mockResolvedValueOnce([
      [
        {
          value: JSON.stringify({
            focusMinutes: 30,
            shortBreakMinutes: 6,
            longBreakMinutes: 15,
            cyclesBeforeLongBreak: 5,
          }),
        },
      ],
    ]);

    await expect(getFocusTimerSettings(user)).resolves.toEqual({
      focusMinutes: 30,
      breakMinutes: 6,
      cycles: 5,
    });
  });

  it('persists only the current three-field focus timer settings shape', async () => {
    queryMock.mockResolvedValueOnce([{}, undefined]);

    const saved = await saveFocusTimerSettings(user, {
      focusMinutes: 40,
      breakMinutes: 8,
      cycles: 3,
    });

    expect(saved).toEqual({
      focusMinutes: 40,
      breakMinutes: 8,
      cycles: 3,
    });
    expect(queryMock).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO user_settings'),
      [
        user.id,
        USER_SETTING_KEYS.focusTimerSettings,
        JSON.stringify({
          focusMinutes: 40,
          breakMinutes: 8,
          cycles: 3,
        }),
      ],
    );
  });
});
