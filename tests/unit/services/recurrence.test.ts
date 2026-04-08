import { describe, expect, it } from 'vitest';
import {
  getDayCodeForDate,
  getDayCodeForIsoDate,
  getTasksForDate,
  getTasksForIsoDate,
  isTaskScheduledForDate,
  isTaskScheduledForIsoDate,
} from '@/services/recurrence';
import { scheduleRulesSchema, taskSchema } from '@/types';

const weekdayRules = scheduleRulesSchema.parse({
  days: ['MO', 'TU', 'TH', 'FR'],
});

const sundayRules = scheduleRulesSchema.parse({
  days: ['SU'],
});

const weekdayTask = taskSchema.parse({
  id: 'task-piano',
  family_id: 'family-maple',
  person_id: 'person-micah',
  title: 'Practice piano',
  emoji: '🎹',
  schedule_rules: weekdayRules,
  created_at: '2026-04-08T00:00:00Z',
});

const sundayTask = taskSchema.parse({
  id: 'task-rest',
  family_id: 'family-maple',
  person_id: 'person-micah',
  title: 'Sunday reset',
  emoji: '🕊️',
  schedule_rules: sundayRules,
  created_at: '2026-04-08T00:00:00Z',
});

describe('recurrence service', () => {
  it('maps all ISO dates to RFC 5545 day codes', () => {
    expect(getDayCodeForIsoDate('2026-04-05')).toBe('SU');
    expect(getDayCodeForIsoDate('2026-04-06')).toBe('MO');
    expect(getDayCodeForIsoDate('2026-04-07')).toBe('TU');
    expect(getDayCodeForIsoDate('2026-04-08')).toBe('WE');
    expect(getDayCodeForIsoDate('2026-04-09')).toBe('TH');
    expect(getDayCodeForIsoDate('2026-04-10')).toBe('FR');
    expect(getDayCodeForIsoDate('2026-04-11')).toBe('SA');
  });

  it('anchors Date-based day lookup to America/New_York', () => {
    expect(getDayCodeForDate(new Date('2026-04-08T03:30:00Z'))).toBe('TU');
    expect(getDayCodeForDate(new Date('2026-04-08T14:00:00Z'))).toBe('WE');
  });

  it('evaluates schedule rules for non-Sunday dates', () => {
    expect(
      isTaskScheduledForDate(weekdayRules, new Date('2026-04-07T16:00:00Z')),
    ).toBe(true);
    expect(
      isTaskScheduledForDate(weekdayRules, new Date('2026-04-08T16:00:00Z')),
    ).toBe(false);
  });

  it('evaluates schedule rules directly from ISO dates', () => {
    expect(isTaskScheduledForIsoDate(weekdayRules, '2026-04-07')).toBe(true);
    expect(isTaskScheduledForIsoDate(weekdayRules, '2026-04-08')).toBe(false);
    expect(isTaskScheduledForIsoDate(sundayRules, '2026-04-05')).toBe(false);
  });

  it('treats Sunday as unscheduled even when SU is present in the rules', () => {
    expect(
      isTaskScheduledForDate(sundayRules, new Date('2026-04-05T16:00:00Z')),
    ).toBe(false);
  });

  it('returns only scheduled tasks for a date and materializes no tasks on Sunday', () => {
    expect(
      getTasksForDate(
        [weekdayTask, sundayTask],
        new Date('2026-04-07T16:00:00Z'),
      ).map((task) => task.id),
    ).toEqual(['task-piano']);

    expect(
      getTasksForDate(
        [weekdayTask, sundayTask],
        new Date('2026-04-05T16:00:00Z'),
      ),
    ).toEqual([]);
  });

  it('returns only scheduled tasks for an ISO date and materializes no tasks on Sunday', () => {
    expect(getTasksForIsoDate([weekdayTask, sundayTask], '2026-04-07')).toEqual(
      [weekdayTask],
    );

    expect(getTasksForIsoDate([weekdayTask, sundayTask], '2026-04-05')).toEqual(
      [],
    );
  });
});
