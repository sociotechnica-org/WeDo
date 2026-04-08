import { identifierSchema, type Identifier } from '@/types';
import type { DatabaseClient } from './database';

export async function getPrimaryFamilyId(
  client: DatabaseClient,
): Promise<Identifier | null> {
  // There is no dedicated families table in v1, so bootstrap from the first
  // known family id across all family-scoped tables instead of coupling to
  // `persons` alone.
  const row = await client
    .prepare(
      `
        select family_id
        from (
          select family_id from persons
          union
          select family_id from tasks
          union
          select family_id from skip_days
        )
        order by family_id asc
        limit 1
      `,
    )
    .first<{ family_id: string }>();

  return row ? identifierSchema.parse(row.family_id) : null;
}
