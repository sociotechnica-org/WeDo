import { and, eq, inArray } from 'drizzle-orm';
import {
  personSchema,
  skipDaySchema,
  taskCompletionSchema,
  taskSchema,
  type IsoDate,
  type IsoTimestamp,
  type Person,
  type ScheduleRules,
  type SkipDay,
  type Task,
  type TaskCompletion,
} from '@/types';
import { getDatabase, type DatabaseClient } from './database';
import {
  personsTable,
  skipDaysTable,
  taskCompletionsTable,
  tasksTable,
} from './schema';
import { toTask } from './task-row';

export type FamilyBoardSourceData = {
  persons: Person[];
  tasks: Task[];
  completions: TaskCompletion[];
  skipDay: SkipDay | null;
};

type TaskCompletionMutation = {
  taskId: string;
  date: IsoDate;
  completedAt: IsoTimestamp;
};

type SkipDayMutation = {
  familyId: string;
  date: IsoDate;
  createdAt: IsoTimestamp;
};

type TaskCreationMutation = {
  familyId: string;
  personId: string;
  title: string;
  emoji: string;
  scheduleRules: ScheduleRules;
  createdAt: IsoTimestamp;
};

export async function getFamilyBoardSourceData(
  client: DatabaseClient,
  familyId: string,
  date: IsoDate,
): Promise<FamilyBoardSourceData> {
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
    .orderBy(tasksTable.person_id, tasksTable.title);

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
              eq(taskCompletionsTable.date, date),
            ),
          );

  const completions = completionRows.map((row) =>
    taskCompletionSchema.parse(row),
  );

  const [skipDayRow] = await db
    .select()
    .from(skipDaysTable)
    .where(
      and(eq(skipDaysTable.family_id, familyId), eq(skipDaysTable.date, date)),
    )
    .limit(1);

  return {
    persons,
    tasks,
    completions,
    skipDay: skipDayRow ? skipDaySchema.parse(skipDayRow) : null,
  };
}

export async function getFamilyTask(
  client: DatabaseClient,
  familyId: string,
  taskId: string,
): Promise<Task | null> {
  const db = getDatabase(client);
  const [taskRow] = await db
    .select()
    .from(tasksTable)
    .where(and(eq(tasksTable.family_id, familyId), eq(tasksTable.id, taskId)))
    .limit(1);

  return taskRow ? toTask(taskRow) : null;
}

export async function getFamilyPerson(
  client: DatabaseClient,
  familyId: string,
  personId: string,
): Promise<Person | null> {
  const db = getDatabase(client);
  const [personRow] = await db
    .select()
    .from(personsTable)
    .where(
      and(eq(personsTable.family_id, familyId), eq(personsTable.id, personId)),
    )
    .limit(1);

  return personRow ? personSchema.parse(personRow) : null;
}

export async function createTask(
  client: DatabaseClient,
  mutation: TaskCreationMutation,
): Promise<Task> {
  const db = getDatabase(client);
  const task = taskSchema.parse({
    id: crypto.randomUUID(),
    family_id: mutation.familyId,
    person_id: mutation.personId,
    title: mutation.title,
    emoji: mutation.emoji,
    schedule_rules: mutation.scheduleRules,
    created_at: mutation.createdAt,
  });

  await db.insert(tasksTable).values(task);

  return task;
}

export async function removeTaskWithCompletions(
  client: DatabaseClient,
  familyId: string,
  taskId: string,
): Promise<void> {
  // Drizzle's D1 driver does not expose batched writes, so deletion uses the
  // raw D1 batch API to keep the task row, its completions, and streak-cache
  // invalidation in one durable write.
  await client.batch([
    client
      .prepare('delete from task_completions where task_id = ?1')
      .bind(taskId),
    client
      .prepare('delete from tasks where family_id = ?1 and id = ?2')
      .bind(familyId, taskId),
    client
      .prepare(
        `
          update streaks
          set evaluated_through_date = null
          where person_id in (
            select id
            from persons
            where family_id = ?1
          )
        `,
      )
      .bind(familyId),
  ]);
}

export async function createTaskCompletion(
  client: DatabaseClient,
  mutation: TaskCompletionMutation,
): Promise<void> {
  const db = getDatabase(client);

  await db
    .insert(taskCompletionsTable)
    .values({
      id: crypto.randomUUID(),
      task_id: mutation.taskId,
      date: mutation.date,
      completed_at: mutation.completedAt,
    })
    .onConflictDoNothing({
      target: [taskCompletionsTable.task_id, taskCompletionsTable.date],
    });
}

export async function removeTaskCompletion(
  client: DatabaseClient,
  taskId: string,
  date: IsoDate,
): Promise<void> {
  const db = getDatabase(client);

  await db
    .delete(taskCompletionsTable)
    .where(
      and(
        eq(taskCompletionsTable.task_id, taskId),
        eq(taskCompletionsTable.date, date),
      ),
    );
}

export async function createSkipDay(
  client: DatabaseClient,
  mutation: SkipDayMutation,
): Promise<void> {
  const db = getDatabase(client);
  const skipDay = skipDaySchema.parse({
    id: crypto.randomUUID(),
    family_id: mutation.familyId,
    date: mutation.date,
    reason: null,
    created_at: mutation.createdAt,
  });

  await db
    .insert(skipDaysTable)
    .values(skipDay)
    .onConflictDoNothing({
      target: [skipDaysTable.family_id, skipDaysTable.date],
    });
}

export async function removeSkipDay(
  client: DatabaseClient,
  familyId: string,
  date: IsoDate,
): Promise<void> {
  const db = getDatabase(client);

  await db
    .delete(skipDaysTable)
    .where(
      and(eq(skipDaysTable.family_id, familyId), eq(skipDaysTable.date, date)),
    );
}
