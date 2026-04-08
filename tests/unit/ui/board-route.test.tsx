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
  todayDate: '2026-04-08',
  realtime: {
    status: 'degraded' as const,
    message: 'The board is still visible, but live updates are paused.',
  },
  createTask: vi.fn(),
  deleteTask: vi.fn(),
  toggleSkipDay: vi.fn(),
  toggleTask: vi.fn(),
  board: {
    family_id: 'family-maple',
    day: {
      date: '2026-04-07',
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

    const markup = renderRoute('/?day=2026-04-07');

    expect(markup).toContain('Live updates paused');
    expect(markup).toContain(
      'The board is still visible, but live updates are paused.',
    );
    expect(markup).toContain('Jess');
    expect(markup).toContain('Kitchen reset');
    expect(useFamilyBoardMock).toHaveBeenCalledWith('2026-04-07');
    expect(markup).toContain('href="/people/person-jess?day=2026-04-07"');
    expect(markup).toContain('aria-label="Go to previous day"');
    expect(markup).toContain('href="/?day=2026-04-06"');
    expect(markup).toContain('href="/"');
    expect(markup).toContain('data-testid="day-skip-toggle"');
    expect(markup).toContain('SKIP DAY');
  });

  it('renders the focused single-list route with back navigation and add-task affordance', () => {
    useFamilyBoardMock.mockReturnValue(readyBoardState);

    const markup = renderRoute('/people/person-jess?day=2026-04-07');

    expect(markup).toContain('Focused list');
    expect(markup).toContain('href="/?day=2026-04-07"');
    expect(markup).toContain('Add task');
    expect(markup).toContain('Toggle Kitchen reset');
    expect(markup).toContain('Delete Kitchen reset');
    expect(markup).toContain('0 of 1 tasks marked for this day.');
    expect(markup).toContain('data-testid="single-list-task-list"');
  });

  it('keeps delete affordances out of the dashboard view', () => {
    useFamilyBoardMock.mockReturnValue(readyBoardState);

    const markup = renderRoute('/?day=2026-04-07');

    expect(markup).not.toContain('Delete Kitchen reset');
  });

  it('renders skipped-day state in both the day label and dashboard task lists', () => {
    useFamilyBoardMock.mockReturnValue({
      ...readyBoardState,
      realtime: {
        status: 'live' as const,
      },
      board: {
        ...readyBoardState.board,
        people: readyBoardState.board.people.map((personState) => ({
          ...personState,
          skip_day: {
            id: 'skip-2026-04-07',
            family_id: 'family-maple',
            date: '2026-04-07',
            reason: null,
            created_at: '2026-04-07T07:00:00Z',
          },
        })),
      },
    });

    const markup = renderRoute('/?day=2026-04-07');

    expect(markup).toContain('data-skipped="true"');
    expect(markup).toContain('line-through');
    expect(markup).toContain('aria-pressed="true"');
  });
});
