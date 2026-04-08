import { beforeEach, describe, expect, it, vi } from 'vitest';

const boardRepositoryMocks = vi.hoisted(() => ({
  getPrimaryFamilyId: vi.fn(),
}));

vi.mock('@/db/board-repository', () => ({
  getPrimaryFamilyId: boardRepositoryMocks.getPrimaryFamilyId,
}));

import {
  BoardBootstrapError,
  getBoardResponse,
  getTodayForTimezone,
  resolveBoardDate,
} from '@/services/board-service';

const { getPrimaryFamilyId } = boardRepositoryMocks;

describe('board-service', () => {
  beforeEach(() => {
    getPrimaryFamilyId.mockReset();
  });

  it('uses the configured timezone to derive the canonical board date', () => {
    expect(
      getTodayForTimezone('America/New_York', new Date('2026-04-08T03:30:00Z')),
    ).toBe('2026-04-07');
  });

  it('returns a schema-safe bootstrap envelope for the realtime dashboard', async () => {
    getPrimaryFamilyId.mockResolvedValue('family-maple');

    const response = await getBoardResponse(
      {
        DB: {} as never,
        HOUSEHOLD_NAME: 'River House',
        TIMEZONE: 'America/New_York',
      },
      {
        now: new Date('2026-04-08T14:15:00Z'),
      },
    );

    expect(response).toEqual({
      board: {
        familyId: 'family-maple',
        householdName: 'River House',
        date: '2026-04-08',
        todayDate: '2026-04-08',
      },
    });
  });

  it('clamps requested future dates to tomorrow only', async () => {
    getPrimaryFamilyId.mockResolvedValue('family-maple');

    const response = await getBoardResponse(
      {
        DB: {} as never,
        HOUSEHOLD_NAME: 'River House',
        TIMEZONE: 'America/New_York',
      },
      {
        now: new Date('2026-04-08T14:15:00Z'),
        requestedDate: '2026-04-15',
      },
    );

    expect(response.board.date).toBe('2026-04-09');
    expect(response.board.todayDate).toBe('2026-04-08');
  });

  it('rejects bootstrap when no household data exists yet', async () => {
    getPrimaryFamilyId.mockResolvedValue(null);

    await expect(
      getBoardResponse({
        DB: {} as never,
      }),
    ).rejects.toThrow(BoardBootstrapError);
  });

  it('preserves past requested dates without clamping them forward', () => {
    expect(
      resolveBoardDate(
        'America/New_York',
        '2026-04-01',
        new Date('2026-04-08T14:15:00Z'),
      ),
    ).toBe('2026-04-01');
  });
});
