import { describe, expect, it } from 'vitest';
import { familyBoardStateSchema } from '@/types';
import {
  createReadyFamilyBoardState,
  findTaskCompletionStatus,
  getRealtimeCloseMessage,
  getRealtimeErrorMessage,
  toggleTaskCompletionInBoard,
  withOptimisticTaskToggle,
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
  const toggleTask = () => true;
  const todayDate = '2026-04-08' as const;

  it('creates a live ready state from the latest board snapshot', () => {
    expect(
      createReadyFamilyBoardState(board, 'River House', todayDate, toggleTask),
    ).toEqual({
      status: 'ready',
      board,
      householdName: 'River House',
      todayDate,
      realtime: {
        status: 'live',
      },
      toggleTask,
    });
  });

  it('preserves the last good board while marking realtime as degraded', () => {
    const readyState = createReadyFamilyBoardState(
      board,
      'River House',
      todayDate,
      toggleTask,
    );

    expect(
      withRealtimeIssue(
        readyState,
        'The board is still visible, but live updates are paused.',
      ),
    ).toEqual({
      status: 'ready',
      board,
      householdName: 'River House',
      todayDate,
      realtime: {
        status: 'degraded',
        message: 'The board is still visible, but live updates are paused.',
      },
      toggleTask,
    });
  });

  it('applies an optimistic completion toggle to the current board snapshot', () => {
    const readyState = createReadyFamilyBoardState(
      board,
      'River House',
      todayDate,
      toggleTask,
    );
    const completedAt = '2026-04-08T12:00:00Z';
    const optimisticState = withOptimisticTaskToggle(
      readyState,
      'task-kitchen',
      completedAt,
    );

    expect(optimisticState?.board.people[0]?.tasks[0]?.completion).toEqual({
      id: 'optimistic:2026-04-08:task-kitchen',
      task_id: 'task-kitchen',
      date: '2026-04-08',
      completed_at: completedAt,
    });
    expect(
      findTaskCompletionStatus(optimisticState!.board, 'task-kitchen'),
    ).toBe(true);
  });

  it('returns null when an optimistic toggle targets a missing task', () => {
    expect(
      toggleTaskCompletionInBoard(
        board,
        'task-missing',
        '2026-04-08T12:00:00Z',
      ),
    ).toBeNull();
    expect(findTaskCompletionStatus(board, 'task-missing')).toBeNull();
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
