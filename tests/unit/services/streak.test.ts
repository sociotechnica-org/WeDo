import { describe, expect, it } from 'vitest';
import {
  calculateFamilyStreaks,
  calculateStreakForPerson,
} from '@/services/streak';
import { personSchema, taskCompletionSchema, taskSchema } from '@/types';

const familyId = 'family-maple';
const person = personSchema.parse({
  id: 'person-jess',
  family_id: familyId,
  name: 'Jess',
  display_order: 0,
  emoji: '🌿',
});

const dailyTask = taskSchema.parse({
  id: 'task-kitchen',
  family_id: familyId,
  person_id: person.id,
  title: 'Kitchen reset',
  emoji: '🍽️',
  schedule_rules: {
    days: ['MO', 'TU', 'WE', 'TH', 'FR', 'SA', 'SU'],
  },
  created_at: '2026-04-01T08:00:00Z',
});

function completionFor(date: string) {
  return taskCompletionSchema.parse({
    id: `completion-${date}`,
    task_id: dailyTask.id,
    date,
    completed_at: `${date}T18:00:00Z`,
  });
}

describe('streak service', () => {
  it('increments across consecutive qualifying days', () => {
    const streak = calculateStreakForPerson(
      person.id,
      {
        tasks: [dailyTask],
        completions: [
          completionFor('2026-04-06'),
          completionFor('2026-04-07'),
          completionFor('2026-04-08'),
        ],
        skipDayDates: [],
      },
      '2026-04-08',
      {
        todayDate: '2026-04-08',
      },
    );

    expect(streak).toEqual({
      person_id: person.id,
      current_count: 3,
      best_count: 3,
      last_qualifying_date: '2026-04-08',
    });
  });

  it('resets on a missed past day while preserving best streak', () => {
    const streak = calculateStreakForPerson(
      person.id,
      {
        tasks: [dailyTask],
        completions: [
          completionFor('2026-04-06'),
          completionFor('2026-04-07'),
          completionFor('2026-04-09'),
        ],
        skipDayDates: [],
      },
      '2026-04-09',
      {
        todayDate: '2026-04-09',
      },
    );

    expect(streak).toEqual({
      person_id: person.id,
      current_count: 1,
      best_count: 2,
      last_qualifying_date: '2026-04-09',
    });
  });

  it('holds across a family skip day and Sunday', () => {
    const streak = calculateStreakForPerson(
      person.id,
      {
        tasks: [dailyTask],
        completions: [
          completionFor('2026-04-04'),
          completionFor('2026-04-06'),
          completionFor('2026-04-08'),
        ],
        skipDayDates: ['2026-04-07'],
      },
      '2026-04-08',
      {
        todayDate: '2026-04-08',
      },
    );

    expect(streak).toEqual({
      person_id: person.id,
      current_count: 3,
      best_count: 3,
      last_qualifying_date: '2026-04-08',
    });
  });

  it('holds the active streak for an incomplete current day and tomorrow', () => {
    const todayStreak = calculateStreakForPerson(
      person.id,
      {
        tasks: [dailyTask],
        completions: [completionFor('2026-04-06'), completionFor('2026-04-07')],
        skipDayDates: [],
      },
      '2026-04-08',
      {
        todayDate: '2026-04-08',
      },
    );
    const tomorrowStreak = calculateStreakForPerson(
      person.id,
      {
        tasks: [dailyTask],
        completions: [
          completionFor('2026-04-06'),
          completionFor('2026-04-07'),
          completionFor('2026-04-09'),
        ],
        skipDayDates: [],
      },
      '2026-04-09',
      {
        todayDate: '2026-04-08',
      },
    );

    expect(todayStreak.current_count).toBe(2);
    expect(todayStreak.best_count).toBe(2);
    expect(todayStreak.last_qualifying_date).toBe('2026-04-07');
    expect(tomorrowStreak.current_count).toBe(2);
    expect(tomorrowStreak.best_count).toBe(2);
    expect(tomorrowStreak.last_qualifying_date).toBe('2026-04-07');
  });

  it('calculates streaks independently per person from the same family history', () => {
    const secondPerson = personSchema.parse({
      id: 'person-micah',
      family_id: familyId,
      name: 'Micah',
      display_order: 1,
      emoji: '⚽',
    });
    const secondTask = taskSchema.parse({
      id: 'task-soccer',
      family_id: familyId,
      person_id: secondPerson.id,
      title: 'Soccer drills',
      emoji: '⚽',
      schedule_rules: {
        days: ['MO', 'TU', 'WE', 'TH', 'FR', 'SA', 'SU'],
      },
      created_at: '2026-04-01T09:00:00Z',
    });

    const streaks = calculateFamilyStreaks(
      {
        familyId,
        persons: [person, secondPerson],
        tasks: [dailyTask, secondTask],
        completions: [
          completionFor('2026-04-06'),
          completionFor('2026-04-07'),
          taskCompletionSchema.parse({
            id: 'completion-micah-2026-04-07',
            task_id: secondTask.id,
            date: '2026-04-07',
            completed_at: '2026-04-07T12:00:00Z',
          }),
        ],
        skipDayDates: [],
      },
      '2026-04-08',
      {
        todayDate: '2026-04-08',
      },
    );

    expect(streaks).toEqual([
      {
        person_id: person.id,
        current_count: 2,
        best_count: 2,
        last_qualifying_date: '2026-04-07',
      },
      {
        person_id: secondPerson.id,
        current_count: 1,
        best_count: 1,
        last_qualifying_date: '2026-04-07',
      },
    ]);
  });
});
