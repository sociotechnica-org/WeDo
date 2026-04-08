import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';

const useFamilyBoardMock = vi.hoisted(() => vi.fn());

vi.mock('@/ui/hooks/use-family-board', () => ({
  useFamilyBoard: useFamilyBoardMock,
}));

import { HomeRoute } from '@/ui/routes/home-route';

describe('HomeRoute', () => {
  it('surfaces degraded realtime status without hiding the board', () => {
    useFamilyBoardMock.mockReturnValue({
      status: 'ready',
      householdName: 'River House',
      realtime: {
        status: 'degraded',
        message: 'The board is still visible, but live updates are paused.',
      },
      board: {
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
              current_count: 2,
              best_count: 5,
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
      },
    });

    const markup = renderToStaticMarkup(<HomeRoute />);

    expect(markup).toContain('Live updates paused');
    expect(markup).toContain(
      'The board is still visible, but live updates are paused.',
    );
    expect(markup).toContain('Jess');
    expect(markup).toContain('Kitchen reset');
  });
});
