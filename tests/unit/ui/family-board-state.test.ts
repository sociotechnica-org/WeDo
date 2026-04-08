import { describe, expect, it } from 'vitest';
import { familyBoardStateSchema } from '@/types';
import {
  createReadyFamilyBoardState,
  getRealtimeCloseMessage,
  getRealtimeErrorMessage,
  withRealtimeIssue,
} from '@/ui/hooks/family-board-state';

const board = familyBoardStateSchema.parse({
  family_id: 'family-maple',
  day: {
    date: '2026-04-08',
    is_sunday: false,
  },
  people: [
    {
      person: {
        id: 'person-jess',
        family_id: 'family-maple',
        name: 'Jess',
        display_order: 0,
        emoji: '🌿',
      },
      streak: {
        person_id: 'person-jess',
        current_count: 3,
        best_count: 7,
        last_qualifying_date: '2026-04-07',
      },
      skip_day: null,
      tasks: [
        {
          task: {
            id: 'task-kitchen',
            family_id: 'family-maple',
            person_id: 'person-jess',
            title: 'Kitchen reset',
            emoji: '🍽️',
            schedule_rules: {
              days: ['MO', 'TU', 'WE', 'TH', 'FR'],
            },
            created_at: '2026-04-08T00:00:00Z',
          },
          completion: null,
        },
      ],
    },
  ],
});

describe('family-board-state helpers', () => {
  it('creates a live ready state from the latest board snapshot', () => {
    expect(createReadyFamilyBoardState(board, 'River House')).toEqual({
      status: 'ready',
      board,
      householdName: 'River House',
      realtime: {
        status: 'live',
      },
    });
  });

  it('preserves the last good board while marking realtime as degraded', () => {
    const readyState = createReadyFamilyBoardState(board, 'River House');

    expect(
      withRealtimeIssue(
        readyState,
        'The board is still visible, but live updates are paused.',
      ),
    ).toEqual({
      status: 'ready',
      board,
      householdName: 'River House',
      realtime: {
        status: 'degraded',
        message: 'The board is still visible, but live updates are paused.',
      },
    });
  });

  it('returns initialization-aware websocket failure copy', () => {
    expect(getRealtimeErrorMessage(false)).toBe(
      'Realtime connection failed before the board loaded.',
    );
    expect(getRealtimeErrorMessage(true)).toBe(
      'The board is still visible, but live updates may be unavailable.',
    );
    expect(getRealtimeCloseMessage('', false)).toBe(
      'Realtime connection closed before the board loaded.',
    );
    expect(getRealtimeCloseMessage('', true)).toBe(
      'The board is still visible, but live updates are paused.',
    );
    expect(getRealtimeCloseMessage('Socket closed by server.', true)).toBe(
      'Socket closed by server.',
    );
  });
});
