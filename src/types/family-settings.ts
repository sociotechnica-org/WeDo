import { z } from 'zod';
import { familySettingsSchema } from './entities';
import { timezoneSchema } from './shared';

export const saveFamilySettingsRequestSchema = z
  .object({
    timezone: timezoneSchema,
  })
  .strict();

export const saveFamilySettingsResponseSchema = z
  .object({
    settings: familySettingsSchema,
  })
  .strict();

export type SaveFamilySettingsRequest = z.infer<
  typeof saveFamilySettingsRequestSchema
>;
export type SaveFamilySettingsResponse = z.infer<
  typeof saveFamilySettingsResponseSchema
>;
