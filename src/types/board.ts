import { z } from 'zod';
import { identifierSchema, isoDateSchema, nonEmptyStringSchema } from './shared';

export const boardBootstrapSchema = z
  .object({
    familyId: identifierSchema,
    householdName: nonEmptyStringSchema,
    date: isoDateSchema,
  })
  .strict();

export const boardResponseSchema = z
  .object({
    board: boardBootstrapSchema,
  })
  .strict();

export type BoardBootstrap = z.infer<typeof boardBootstrapSchema>;
export type BoardResponse = z.infer<typeof boardResponseSchema>;
