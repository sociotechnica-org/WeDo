import { z } from 'zod';
import { familyBoardStateSchema, taskSchema } from './entities';
import {
  identifierSchema,
  isoDateSchema,
  nonEmptyStringSchema,
  scheduleRulesSchema,
} from './shared';

export const nlTaskEntryRequestSchema = z
  .object({
    person_id: identifierSchema,
    raw_input: nonEmptyStringSchema,
    viewed_date: isoDateSchema,
  })
  .strict();

export const parsedTaskSchema = z
  .object({
    title: nonEmptyStringSchema,
    emoji: nonEmptyStringSchema,
    schedule_rules: scheduleRulesSchema,
  })
  .strict();

export const createTaskMutationSchema = z
  .object({
    person_id: identifierSchema,
    viewed_date: isoDateSchema,
    task: parsedTaskSchema,
  })
  .strict();

export const createTaskResponseSchema = z
  .object({
    task: taskSchema,
    state: familyBoardStateSchema,
  })
  .strict();

export type NlTaskEntryRequest = z.infer<typeof nlTaskEntryRequestSchema>;
export type ParsedTask = z.infer<typeof parsedTaskSchema>;
export type CreateTaskMutation = z.infer<typeof createTaskMutationSchema>;
export type CreateTaskResponse = z.infer<typeof createTaskResponseSchema>;
