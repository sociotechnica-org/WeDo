import { eq } from 'drizzle-orm';
import {
  familySettingsSchema,
  type FamilySettings,
  type Identifier,
} from '@/types';
import { getDatabase, type DatabaseClient } from './database';
import { familySettingsTable } from './schema';

export async function getFamilySettings(
  client: DatabaseClient,
  familyId: Identifier,
): Promise<FamilySettings | null> {
  const db = getDatabase(client);
  const [row] = await db
    .select()
    .from(familySettingsTable)
    .where(eq(familySettingsTable.family_id, familyId))
    .limit(1);

  return row ? familySettingsSchema.parse(row) : null;
}

export async function upsertFamilySettings(
  client: DatabaseClient,
  settings: FamilySettings,
): Promise<FamilySettings> {
  const parsedSettings = familySettingsSchema.parse(settings);
  const db = getDatabase(client);

  await db
    .insert(familySettingsTable)
    .values(parsedSettings)
    .onConflictDoUpdate({
      target: familySettingsTable.family_id,
      set: {
        timezone: parsedSettings.timezone,
        updated_at: parsedSettings.updated_at,
      },
    });

  return parsedSettings;
}
