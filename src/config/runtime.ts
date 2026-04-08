import { z } from 'zod';

const runtimeEnvironmentSchema = z.object({
  HOUSEHOLD_NAME: z.string().trim().min(1).optional(),
});

export type WorkerBindings = {
  HOUSEHOLD_NAME?: string;
};

export function getRuntimeConfig(bindings: WorkerBindings) {
  const parsed = runtimeEnvironmentSchema.parse(bindings);

  return {
    householdName: parsed.HOUSEHOLD_NAME ?? 'Maple House',
  };
}
