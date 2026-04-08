import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';

const useFamilyBoardMock = vi.hoisted(() => vi.fn());

vi.mock('@/ui/hooks/use-family-board', () => ({
  useFamilyBoard: useFamilyBoardMock,
}));

import { BoardRoute } from '@/ui/routes/board-route';
import { DashboardRoute } from '@/ui/routes/dashboard-route';
import { SingleListRoute } from '@/ui/routes/single-list-route';

const readyBoardState = {
  status: 'ready' as const,
  householdName: 'River House',
  realtime: {
    status: 'degraded' as const,
    message: 'The board is still visible, but live updates are paused.',
  },
  toggleTask: vi.fn(),
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
};

function renderRoute(entry: string) {
  return renderToStaticMarkup(
    <MemoryRouter initialEntries={[entry]}>
      <Routes>
        <Route element={<BoardRoute />} path="/">
          <Route element={<DashboardRoute />} index />
          <Route element={<SingleListRoute />} path="people/:personId" />
        </Route>
      </Routes>
    </MemoryRouter>,
  );
}

describe('Board routes', () => {
  it('surfaces degraded realtime status on the dashboard without hiding person links', () => {
    useFamilyBoardMock.mockReturnValue(readyBoardState);

    const markup = renderRoute('/');

    expect(markup).toContain('Live updates paused');
    expect(markup).toContain(
      'The board is still visible, but live updates are paused.',
    );
    expect(markup).toContain('Jess');
    expect(markup).toContain('Kitchen reset');
    expect(markup).toContain('href="/people/person-jess"');
  });

  it('renders the focused single-list route with back navigation and add-task affordance', () => {
    useFamilyBoardMock.mockReturnValue(readyBoardState);

    const markup = renderRoute('/people/person-jess');

    expect(markup).toContain('Focused list');
    expect(markup).toContain('Back');
    expect(markup).toContain('Add task');
    expect(markup).toContain('Toggle Kitchen reset');
    expect(markup).toContain('0 of 1 tasks done today.');
  });
});
