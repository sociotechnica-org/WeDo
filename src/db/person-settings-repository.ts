import { eq } from 'drizzle-orm';
import { personSchema, streakSchema, type Person } from '@/types';
import { getDatabase, type DatabaseClient } from './database';
import { personsTable } from './schema';

export type ExistingPersonUpdate = {
  id: string;
  temporaryName: string;
  temporaryDisplayOrder: number;
  name: string;
  emoji: string;
  displayOrder: number;
};

export type NewPersonInsert = Person;

export type SaveFamilyPersonsPlan = {
  removedPersonIds: string[];
  existingUpdates: ExistingPersonUpdate[];
  newPeople: NewPersonInsert[];
};

export async function getFamilyPersons(
  client: DatabaseClient,
  familyId: string,
): Promise<Person[]> {
  const db = getDatabase(client);
  const personRows = await db
    .select()
    .from(personsTable)
    .where(eq(personsTable.family_id, familyId))
    .orderBy(personsTable.display_order);

  return personRows.map((row) => personSchema.parse(row));
}

export async function applySaveFamilyPersonsPlan(
  client: DatabaseClient,
  familyId: string,
  plan: SaveFamilyPersonsPlan,
): Promise<void> {
  const statements: D1PreparedStatement[] = [];

  for (const update of plan.existingUpdates) {
    statements.push(
      client
        .prepare(
          `
            update persons
            set name = ?1, display_order = ?2
            where family_id = ?3 and id = ?4
          `,
        )
        .bind(
          update.temporaryName,
          update.temporaryDisplayOrder,
          familyId,
          update.id,
        ),
    );
  }

  for (const personId of plan.removedPersonIds) {
    statements.push(
      client
        .prepare(
          `
            delete from persons
            where family_id = ?1 and id = ?2
          `,
        )
        .bind(familyId, personId),
    );
  }

  for (const person of plan.newPeople) {
    const parsedPerson = personSchema.parse(person);

    statements.push(
      client
        .prepare(
          `
            insert into persons (id, family_id, name, display_order, emoji)
            values (?1, ?2, ?3, ?4, ?5)
          `,
        )
        .bind(
          parsedPerson.id,
          parsedPerson.family_id,
          parsedPerson.name,
          parsedPerson.display_order,
          parsedPerson.emoji,
        ),
    );

    const streak = streakSchema.parse({
      person_id: parsedPerson.id,
      current_count: 0,
      best_count: 0,
      last_qualifying_date: null,
    });

    statements.push(
      client
        .prepare(
          `
            insert into streaks (
              person_id,
              current_count,
              best_count,
              last_qualifying_date,
              evaluated_through_date
            )
            values (?1, ?2, ?3, ?4, ?5)
          `,
        )
        .bind(
          streak.person_id,
          streak.current_count,
          streak.best_count,
          streak.last_qualifying_date,
          null,
        ),
    );
  }

  for (const update of plan.existingUpdates) {
    statements.push(
      client
        .prepare(
          `
            update persons
            set name = ?1, emoji = ?2, display_order = ?3
            where family_id = ?4 and id = ?5
          `,
        )
        .bind(
          update.name,
          update.emoji,
          update.displayOrder,
          familyId,
          update.id,
        ),
    );
  }

  if (statements.length === 0) {
    return;
  }

  await client.batch(statements);
}
