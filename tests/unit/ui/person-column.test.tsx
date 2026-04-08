import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { personDayStateSchema } from '@/types';
import { PersonColumn } from '@/ui/components/person-column';

const personState = personDayStateSchema.parse({
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
          days: ['MO', 'TU', 'WE', 'TH', 'FR', 'SA'],
        },
        created_at: '2026-04-08T00:00:00Z',
      },
      completion: null,
    },
  ],
});

describe('PersonColumn', () => {
  it('renders streak, completion ring, and compact task rows for the dashboard', () => {
    const markup = renderToStaticMarkup(
      <PersonColumn paletteIndex={0} personState={personState} />,
    );

    expect(markup).toContain('Jess');
    expect(markup).toContain('3 day streak');
    expect(markup).toContain('Kitchen reset');
    expect(markup).toContain('🍽️');
    expect(markup).toContain('aria-label="0 of 1 tasks complete"');
  });

  it('renders a quiet empty-state placeholder when the person has no tasks today', () => {
    const markup = renderToStaticMarkup(
      <PersonColumn
        paletteIndex={1}
        personState={{
          ...personState,
          tasks: [],
        }}
      />,
    );

    expect(markup).toContain('No tasks today.');
  });

  it('uses quiet zero-state streak copy instead of a numeric zero streak', () => {
    const markup = renderToStaticMarkup(
      <PersonColumn
        paletteIndex={2}
        personState={{
          ...personState,
          streak: {
            ...personState.streak,
            current_count: 0,
          },
        }}
      />,
    );

    expect(markup).toContain('No streak yet');
    expect(markup).not.toContain('0 day streak');
  });
});
