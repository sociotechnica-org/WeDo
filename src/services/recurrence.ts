import { getIsoDateForTimezone, wedoTimezone } from '@/config/timezone';
import type { DayCode, IsoDate, ScheduleRules, Task, Timezone } from '@/types';

const dayCodeBySundayIndex = [
  'SU',
  'MO',
  'TU',
  'WE',
  'TH',
  'FR',
  'SA',
] as const satisfies ReadonlyArray<DayCode>;

function getUtcDayIndexForIsoDate(date: IsoDate): number {
  const [year, month, day] = date.split('-').map(Number);

  return new Date(Date.UTC(year ?? 0, (month ?? 1) - 1, day ?? 1)).getUTCDay();
}

export function getDayCodeForIsoDate(date: IsoDate): DayCode {
  return dayCodeBySundayIndex[getUtcDayIndexForIsoDate(date)] ?? 'SU';
}

export function getDayCodeForDate(
  date: Date,
  timezone: Timezone = wedoTimezone,
): DayCode {
  return getDayCodeForIsoDate(getIsoDateForTimezone(timezone, date));
}

function isDayCodeScheduled(
  scheduleRules: ScheduleRules,
  dayCode: DayCode,
): boolean {
  return dayCode !== 'SU' && scheduleRules.days.includes(dayCode);
}

export function isTaskScheduledForIsoDate(
  scheduleRules: ScheduleRules,
  date: IsoDate,
): boolean {
  return isDayCodeScheduled(scheduleRules, getDayCodeForIsoDate(date));
}

export function isTaskScheduledForDate(
  scheduleRules: ScheduleRules,
  date: Date,
  timezone: Timezone = wedoTimezone,
): boolean {
  return isDayCodeScheduled(scheduleRules, getDayCodeForDate(date, timezone));
}

export function getTasksForIsoDate(
  tasks: ReadonlyArray<Task>,
  date: IsoDate,
): Task[] {
  return tasks.filter((task) =>
    isTaskScheduledForIsoDate(task.schedule_rules, date),
  );
}

export function getTasksForDate(
  tasks: ReadonlyArray<Task>,
  date: Date,
  timezone: Timezone = wedoTimezone,
): Task[] {
  return tasks.filter((task) =>
    isTaskScheduledForDate(task.schedule_rules, date, timezone),
  );
}
