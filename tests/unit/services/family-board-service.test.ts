import { describe, expect, it } from 'vitest';
import {
  FamilyBoardStateError,
  buildFamilyBoardState,
  getDayCodeForDate,
  isTaskScheduledForDate,
} from '@/services/family-board-service';
import {
  personSchema,
  skipDaySchema,
  streakSchema,
  taskCompletionSchema,
  taskSchema,
} from '@/types';

const familyId = 'family-maple';
const date = '2026-04-07' as const;

const jess = personSchema.parse({
  id: 'person-jess',
  family_id: familyId,
  name: 'Jess',
  display_order: 0,
  emoji: '🌿',
});

const micah = personSchema.parse({
  id: 'person-micah',
  family_id: familyId,
  name: 'Micah',
  display_order: 1,
  emoji: '⚽',
});

const tuesdayTask = taskSchema.parse({
  id: 'task-piano',
  family_id: familyId,
  person_id: micah.id,
  title: 'Practice piano',
  emoji: '🎹',
  schedule_rules: {
    days: ['TU', 'TH'],
  },
  created_at: '2026-04-07T08:00:00Z',
});

const mondayTask = taskSchema.parse({
  id: 'task-fold',
  family_id: familyId,
  person_id: jess.id,
  title: 'Fold laundry',
  emoji: '🧺',
  schedule_rules: {
    days: ['MO'],
  },
  created_at: '2026-04-07T08:00:00Z',
});

const sundayTask = taskSchema.parse({
  id: 'task-sabbath',
  family_id: familyId,
  person_id: jess.id,
  title: 'Sunday reset',
  emoji: '🕊️',
  schedule_rules: {
    days: ['SU'],
  },
  created_at: '2026-04-07T08:00:00Z',
});

const completion = taskCompletionSchema.parse({
  id: 'completion-piano',
  task_id: tuesdayTask.id,
  date,
  completed_at: '2026-04-07T18:45:00Z',
});

const skipDay = skipDaySchema.parse({
  id: 'skip-1',
  family_id: familyId,
  date,
  reason: 'Travel day',
  created_at: '2026-04-07T06:00:00Z',
});

const streak = streakSchema.parse({
  person_id: micah.id,
  current_count: 3,
  best_count: 8,
  last_qualifying_date: '2026-04-06',
});

describe('family-board-service', () => {
  it('maps ISO dates to RFC 5545 day codes', () => {
    expect(getDayCodeForDate('2026-04-07')).toBe('TU');
    expect(getDayCodeForDate('2026-04-05')).toBe('SU');
  });

  it('checks whether a task should appear on a requested date', () => {
    expect(isTaskScheduledForDate(tuesdayTask, date)).toBe(true);
    expect(isTaskScheduledForDate(mondayTask, date)).toBe(false);
    expect(isTaskScheduledForDate(sundayTask, '2026-04-05')).toBe(false);
  });

  it('builds family board state with recurrence filtering, completions, and default streaks', () => {
    const state = buildFamilyBoardState({
      familyId,
      date,
      persons: [jess, micah],
      tasks: [mondayTask, tuesdayTask],
      completions: [completion],
      skipDay,
      streaks: [streak],
    });

    expect(state.family_id).toBe(familyId);
    expect(state.day).toEqual({
      date,
      is_sunday: false,
    });
    expect(state.people).toHaveLength(2);
    expect(state.people[0]?.tasks).toEqual([]);
    expect(state.people[0]?.streak).toEqual({
      person_id: jess.id,
      current_count: 0,
      best_count: 0,
      last_qualifying_date: null,
    });
    expect(state.people[0]?.skip_day).toEqual(skipDay);
    expect(state.people[1]?.tasks).toHaveLength(1);
    expect(state.people[1]?.tasks[0]?.task.id).toBe(tuesdayTask.id);
    expect(state.people[1]?.tasks[0]?.completion).toEqual(completion);
    expect(state.people[1]?.streak).toEqual(streak);
  });

  it('builds a Sunday board with empty task lists for every person', () => {
    const state = buildFamilyBoardState({
      familyId,
      date: '2026-04-05',
      persons: [jess, micah],
      tasks: [tuesdayTask, sundayTask],
      completions: [],
      skipDay: null,
      streaks: [streak],
    });

    expect(state.day).toEqual({
      date: '2026-04-05',
      is_sunday: true,
    });
    expect(state.people.every((person) => person.tasks.length === 0)).toBe(
      true,
    );
  });

  it('rejects board-state assembly for a family with no people', () => {
    expect(() =>
      buildFamilyBoardState({
        familyId,
        date,
        persons: [],
        tasks: [],
        completions: [],
        skipDay: null,
        streaks: [],
      }),
    ).toThrow(FamilyBoardStateError);
  });
});
