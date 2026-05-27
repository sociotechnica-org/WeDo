import {
  getFamilySettings,
  upsertFamilySettings,
} from '@/db/family-settings-repository';
import { type DatabaseClient } from '@/db/database';
import {
  familySettingsSchema,
  timezoneSchema,
  type FamilySettings,
  type Identifier,
  type Timezone,
} from '@/types';

type SaveFamilySettingsInput = {
  familyId: Identifier;
  timezone: Timezone;
};

export class FamilySettingsError extends Error {}

function getCurrentTimestamp(): string {
  return new Date().toISOString();
}

export async function getSavedFamilyTimezone(
  client: DatabaseClient,
  familyId: Identifier,
): Promise<Timezone | null> {
  const settings = await getFamilySettings(client, familyId);

  return settings?.timezone ?? null;
}

export async function saveFamilySettings(
  client: DatabaseClient,
  input: SaveFamilySettingsInput,
): Promise<FamilySettings> {
  const timezone = timezoneSchema.parse(input.timezone);
  const settings = familySettingsSchema.parse({
    family_id: input.familyId,
    timezone,
    updated_at: getCurrentTimestamp(),
  });

  return await upsertFamilySettings(client, settings);
}
