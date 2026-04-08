import { z } from 'zod';
import {
  identifierSchema,
  isoDateSchema,
  isoTimestampSchema,
  nonEmptyStringSchema,
  scheduleRulesSchema,
} from './shared';

export const personSchema = z
  .object({
    id: identifierSchema,
    family_id: identifierSchema,
    name: nonEmptyStringSchema,
    display_order: z.number().int().min(0),
    emoji: nonEmptyStringSchema,
  })
  .strict();

export const taskSchema = z
  .object({
    id: identifierSchema,
    family_id: identifierSchema,
    person_id: identifierSchema,
    title: nonEmptyStringSchema,
    emoji: nonEmptyStringSchema,
    schedule_rules: scheduleRulesSchema,
    created_at: isoTimestampSchema,
  })
  .strict();

export const taskCompletionSchema = z
  .object({
    id: identifierSchema,
    task_id: identifierSchema,
    date: isoDateSchema,
    completed_at: isoTimestampSchema,
  })
  .strict();

export const skipDaySchema = z
  .object({
    id: identifierSchema,
    family_id: identifierSchema,
    date: isoDateSchema,
    reason: nonEmptyStringSchema.optional(),
    created_at: isoTimestampSchema,
  })
  .strict();

export const streakSchema = z
  .object({
    person_id: identifierSchema,
    current_count: z.number().int().min(0),
    best_count: z.number().int().min(0),
    last_qualifying_date: isoDateSchema.nullable(),
  })
  .strict();

export const daySchema = z
  .object({
    date: isoDateSchema,
    is_sunday: z.boolean(),
  })
  .strict();

export const taskInstanceSchema = z
  .object({
    task: taskSchema,
    completion: taskCompletionSchema.nullable(),
  })
  .strict();

export const personDayStateSchema = z
  .object({
    person: personSchema,
    streak: streakSchema,
    skip_day: skipDaySchema.nullable(),
    tasks: z.array(taskInstanceSchema),
  })
  .strict();

export const familyBoardStateSchema = z
  .object({
    family_id: identifierSchema,
    day: daySchema,
    people: z.array(personDayStateSchema).min(1),
  })
  .strict();

export type Person = z.infer<typeof personSchema>;
export type Task = z.infer<typeof taskSchema>;
export type TaskCompletion = z.infer<typeof taskCompletionSchema>;
export type SkipDay = z.infer<typeof skipDaySchema>;
export type Streak = z.infer<typeof streakSchema>;
export type Day = z.infer<typeof daySchema>;
export type TaskInstance = z.infer<typeof taskInstanceSchema>;
export type PersonDayState = z.infer<typeof personDayStateSchema>;
export type FamilyBoardState = z.infer<typeof familyBoardStateSchema>;
