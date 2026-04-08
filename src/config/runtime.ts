import { z } from 'zod';
import { defaultTimezone, timezoneSchema } from '@/types/shared';

const runtimeEnvironmentSchema = z.object({
  HOUSEHOLD_NAME: z.string().trim().min(1).optional(),
  TIMEZONE: timezoneSchema.optional(),
});

export type WorkerBindings = {
  HOUSEHOLD_NAME?: string;
  TIMEZONE?: string;
};

export function getRuntimeConfig(bindings: WorkerBindings) {
  const parsed = runtimeEnvironmentSchema.parse(bindings);

  return {
    householdName: parsed.HOUSEHOLD_NAME ?? 'Maple House',
    timezone: parsed.TIMEZONE ?? defaultTimezone,
  };
}
