import { z } from 'zod';
import { defaultTimezone, timezoneSchema } from '@/types/shared';

const runtimeEnvironmentSchema = z.object({
  ANTHROPIC_API_KEY: z.string().trim().min(1).optional(),
  HOUSEHOLD_NAME: z.string().trim().min(1).optional(),
  TIMEZONE: timezoneSchema.optional(),
});

export type RuntimeConfigBindings = {
  ANTHROPIC_API_KEY?: string;
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

export function getAnthropicApiKey(bindings: RuntimeConfigBindings) {
  const parsed = runtimeEnvironmentSchema.parse(bindings);

  if (!parsed.ANTHROPIC_API_KEY) {
    throw new Error('Anthropic API key is not configured for this Worker.');
  }

  return parsed.ANTHROPIC_API_KEY;
}
