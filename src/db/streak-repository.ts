import { and, eq, inArray, lte, sql } from 'drizzle-orm';
import {
  isoDateSchema,
  personSchema,
  streakSchema,
  taskCompletionSchema,
  type IsoDate,
  type Person,
  type Streak,
  type Task,
  type TaskCompletion,
} from '@/types';
import { getDatabase, type DatabaseClient } from './database';
import {
  personsTable,
  skipDaysTable,
  streaksTable,
  taskCompletionsTable,
  tasksTable,
} from './schema';
import { toTask } from './task-row';

export type PersistedStreak = Streak & {
  evaluated_through_date: IsoDate | null;
};

export type FamilyStreakCalculationSource = {
  familyId: string;
  persons: Person[];
  tasks: Task[];
  completions: TaskCompletion[];
  skipDayDates: IsoDate[];
};

type PersistedStreakMutation = PersistedStreak;

function toPersistedStreak(
  row: typeof streaksTable.$inferSelect,
): PersistedStreak {
  const streak = streakSchema.parse({
    person_id: row.person_id,
    current_count: row.current_count,
    best_count: row.best_count,
    last_qualifying_date: row.last_qualifying_date,
  });

  return {
    ...streak,
    evaluated_through_date:
      row.evaluated_through_date === null
        ? null
        : isoDateSchema.parse(row.evaluated_through_date),
  };
}

export async function getFamilyStreakCalculationSource(
  client: DatabaseClient,
  familyId: string,
  throughDate: IsoDate,
): Promise<FamilyStreakCalculationSource> {
  const db = getDatabase(client);

  const personRows = await db
    .select()
    .from(personsTable)
    .where(eq(personsTable.family_id, familyId))
    .orderBy(personsTable.display_order);

  const persons = personRows.map((row) => personSchema.parse(row));

  const taskRows = await db
    .select()
    .from(tasksTable)
    .where(eq(tasksTable.family_id, familyId))
    .orderBy(tasksTable.person_id, tasksTable.created_at, tasksTable.title);

  const tasks = taskRows.map(toTask);
  const taskIds = tasks.map((task) => task.id);

  const completionRows =
    taskIds.length === 0
      ? []
      : await db
          .select()
          .from(taskCompletionsTable)
          .where(
            and(
              inArray(taskCompletionsTable.task_id, taskIds),
              lte(taskCompletionsTable.date, throughDate),
            ),
          );

  const skipDayRows = await db
    .select({
      date: skipDaysTable.date,
    })
    .from(skipDaysTable)
    .where(
      and(
        eq(skipDaysTable.family_id, familyId),
        lte(skipDaysTable.date, throughDate),
      ),
    )
    .orderBy(skipDaysTable.date);

  return {
    familyId,
    persons,
    tasks,
    completions: completionRows.map((row) => taskCompletionSchema.parse(row)),
    skipDayDates: skipDayRows.map((row) => isoDateSchema.parse(row.date)),
  };
}

export async function getFamilyPersistedStreaks(
  client: DatabaseClient,
  familyId: string,
): Promise<PersistedStreak[]> {
  const db = getDatabase(client);
  const personRows = await db
    .select({
      id: personsTable.id,
    })
    .from(personsTable)
    .where(eq(personsTable.family_id, familyId))
    .orderBy(personsTable.display_order);

  const personIds = personRows.map((row) => row.id);

  if (personIds.length === 0) {
    return [];
  }

  const rows = await db
    .select()
    .from(streaksTable)
    .where(inArray(streaksTable.person_id, personIds));

  return rows.map(toPersistedStreak);
}

export async function savePersistedStreaks(
  client: DatabaseClient,
  streaks: ReadonlyArray<PersistedStreakMutation>,
): Promise<void> {
  if (streaks.length === 0) {
    return;
  }

  const db = getDatabase(client);

  await db
    .insert(streaksTable)
    .values([...streaks])
    .onConflictDoUpdate({
      target: streaksTable.person_id,
      set: {
        current_count: sql`excluded.current_count`,
        best_count: sql`excluded.best_count`,
        last_qualifying_date: sql`excluded.last_qualifying_date`,
        evaluated_through_date: sql`excluded.evaluated_through_date`,
      },
    });
}
