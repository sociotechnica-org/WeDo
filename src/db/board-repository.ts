import { asc } from 'drizzle-orm';
import { identifierSchema, type Identifier } from '@/types';
import { getDatabase, type DatabaseClient } from './database';
import { personsTable } from './schema';

export async function getPrimaryFamilyId(
  client: DatabaseClient,
): Promise<Identifier | null> {
  const db = getDatabase(client);
  const [row] = await db
    .select({
      familyId: personsTable.family_id,
    })
    .from(personsTable)
    .orderBy(asc(personsTable.family_id), asc(personsTable.display_order))
    .limit(1);

  return row ? identifierSchema.parse(row.familyId) : null;
}
