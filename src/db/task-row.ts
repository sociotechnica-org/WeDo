import { taskSchema, type ScheduleRules, type Task } from '@/types';
import { scheduleRulesSchema } from '@/types/shared';
import { type TaskRow } from './schema';

export function parseScheduleRules(value: unknown): ScheduleRules {
  if (typeof value === 'string') {
    return scheduleRulesSchema.parse(JSON.parse(value));
  }

  return scheduleRulesSchema.parse(value);
}

export function toTask(row: TaskRow): Task {
  return taskSchema.parse({
    ...row,
    schedule_rules: parseScheduleRules(row.schedule_rules),
  });
}
