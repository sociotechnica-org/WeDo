import { describe, expect, it } from 'vitest';
import {
  personSchema,
  streakSchema,
  taskSchema,
  type Person,
  type Streak,
  type Task,
} from '@/types';
import {
  martinFamilyId,
  martinFamilyPersons,
  martinFamilyStreaks,
  martinFamilyTasks,
  martinSeedData,
} from '@/db/seed';

describe('db seed data', () => {
  it('seeds the Martin household persons in stable display order', () => {
    expect(martinSeedData.family_id).toBe(martinFamilyId);
    expect(martinFamilyPersons).toHaveLength(6);

    const displayOrder = martinFamilyPersons.map((person) => person.display_order);

    expect(displayOrder).toEqual([0, 1, 2, 3, 4, 5]);
    expect(new Set(displayOrder).size).toBe(martinFamilyPersons.length);
    expect(martinFamilyPersons.map((person) => person.name)).toEqual([
      'Jess',
      'Elizabeth',
      'Micah',
      'Moriah',
      'Wells',
      'Cora',
    ]);

    for (const person of martinFamilyPersons) {
      expect(personSchema.parse(person)).toEqual(person);
    }
  });

  it('seeds representative recurring tasks with valid schedule rules', () => {
    expect(martinFamilyTasks.length).toBeGreaterThanOrEqual(8);
    expect(martinFamilyTasks.length).toBeLessThanOrEqual(12);

    const personIds = new Set(martinFamilyPersons.map((person) => person.id));
    const assigneeCoverage = new Set(martinFamilyTasks.map((task) => task.person_id));

    expect(assigneeCoverage.size).toBeGreaterThanOrEqual(5);

    for (const task of martinFamilyTasks) {
      expect(task.family_id).toBe(martinFamilyId);
      expect(personIds.has(task.person_id)).toBe(true);
      expect(taskSchema.parse(task)).toEqual(task);
    }
  });

  it('starts with empty completions and skip days plus zeroed streaks', () => {
    expect(martinSeedData.task_completions).toEqual([]);
    expect(martinSeedData.skip_days).toEqual([]);
    expect(martinFamilyStreaks).toHaveLength(martinFamilyPersons.length);

    for (const streak of martinFamilyStreaks) {
      expect(streakSchema.parse(streak)).toEqual(streak);
      expect(streak.current_count).toBe(0);
      expect(streak.best_count).toBe(0);
      expect(streak.last_qualifying_date).toBeNull();
    }
  });

  it('keeps the exported seed collections aligned to the contract types', () => {
    const persons: Person[] = martinFamilyPersons;
    const tasks: Task[] = martinFamilyTasks;
    const streaks: Streak[] = martinFamilyStreaks;

    expect(persons).toHaveLength(6);
    expect(tasks.length).toBeGreaterThan(0);
    expect(streaks).toHaveLength(6);
  });
});
