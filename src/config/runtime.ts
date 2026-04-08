import { z } from 'zod';
import { defaultTimezone, timezoneSchema } from '@/types/shared';

const runtimeEnvironmentSchema = z.object({
  HOUSEHOLD_NAME: z.string().trim().min(1).optional(),
  TIMEZONE: timezoneSchema.optional(),
});

export type RuntimeConfigBindings = {
  HOUSEHOLD_NAME?: string;
  TIMEZONE?: string;
};

export type WorkerBindings = RuntimeConfigBindings & {
  DB: D1Database;
  FAMILY_BOARD: DurableObjectNamespace;
};

export function getRuntimeConfig(bindings: RuntimeConfigBindings) {
  const parsed = runtimeEnvironmentSchema.parse(bindings);

  return {
    householdName: parsed.HOUSEHOLD_NAME ?? 'Maple House',
    timezone: parsed.TIMEZONE ?? defaultTimezone,
  };
}
