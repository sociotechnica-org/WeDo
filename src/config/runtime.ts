import { z } from 'zod';
import { defaultTimezone, timezoneSchema } from '@/types/shared';

const taskParserModeSchema = z.enum(['live', 'stub']);
export type TaskParserMode = z.infer<typeof taskParserModeSchema>;

const runtimeEnvironmentSchema = z.object({
  ANTHROPIC_API_KEY: z.string().trim().min(1).optional(),
  HOUSEHOLD_NAME: z.string().trim().min(1).optional(),
  TASK_PARSER_MODE: taskParserModeSchema.optional(),
  TIMEZONE: timezoneSchema.optional(),
});

export type RuntimeConfigBindings = {
  ANTHROPIC_API_KEY?: string;
  HOUSEHOLD_NAME?: string;
  TASK_PARSER_MODE?: string;
  TIMEZONE?: string;
};

export type WorkerBindings = RuntimeConfigBindings & {
  DB: D1Database;
  FAMILY_BOARD: DurableObjectNamespace;
};

export type TaskParserConfig =
  | {
      mode: 'live';
      apiKey: string;
    }
  | {
      mode: 'stub';
    };

export function getRuntimeConfig(bindings: RuntimeConfigBindings) {
  const parsed = runtimeEnvironmentSchema.parse(bindings);

  return {
    householdName: parsed.HOUSEHOLD_NAME ?? 'Maple House',
    timezone: parsed.TIMEZONE ?? defaultTimezone,
  };
}

export function getTaskParserConfig(
  bindings: RuntimeConfigBindings,
  modeOverride?: TaskParserMode,
): TaskParserConfig {
  const parsed = runtimeEnvironmentSchema.parse(bindings);
  const mode = modeOverride ?? parsed.TASK_PARSER_MODE ?? 'live';

  if (mode === 'stub') {
    return {
      mode: 'stub',
    };
  }

  if (!parsed.ANTHROPIC_API_KEY) {
    throw new Error('Anthropic API key is not configured for this Worker.');
  }

  return {
    mode: 'live',
    apiKey: parsed.ANTHROPIC_API_KEY,
  };
}
