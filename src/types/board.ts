import { z } from 'zod';
import {
  identifierSchema,
  isoDateSchema,
  nonEmptyStringSchema,
  timezoneSchema,
} from './shared';

export const boardRequestQuerySchema = z
  .object({
    day: isoDateSchema.optional().catch(undefined),
  })
  .strict();

export const boardBootstrapSchema = z
  .object({
    familyId: identifierSchema,
    householdName: nonEmptyStringSchema,
    timezone: timezoneSchema,
    date: isoDateSchema,
    todayDate: isoDateSchema,
  })
  .strict();

export const boardResponseSchema = z
  .object({
    board: boardBootstrapSchema,
  })
  .strict();

export type BoardBootstrap = z.infer<typeof boardBootstrapSchema>;
export type BoardResponse = z.infer<typeof boardResponseSchema>;
export type BoardRequestQuery = z.infer<typeof boardRequestQuerySchema>;
