import { and, eq, inArray } from 'drizzle-orm';
import {
  personSchema,
  skipDaySchema,
  streakSchema,
  taskCompletionSchema,
  taskSchema,
  type IsoDate,
  type IsoTimestamp,
  type Person,
  type ScheduleRules,
  type SkipDay,
  type Streak,
  type Task,
  type TaskCompletion,
} from '@/types';
import { scheduleRulesSchema } from '@/types/shared';
import { getDatabase, type DatabaseClient } from './database';
import {
  personsTable,
  skipDaysTable,
  streaksTable,
  taskCompletionsTable,
  tasksTable,
} from './schema';

export type FamilyBoardSourceData = {
  persons: Person[];
  tasks: Task[];
  completions: TaskCompletion[];
  skipDay: SkipDay | null;
  streaks: Streak[];
};

type TaskCompletionMutation = {
  taskId: string;
  date: IsoDate;
  completedAt: IsoTimestamp;
};

type TaskCreationMutation = {
  familyId: string;
  personId: string;
  title: string;
  emoji: string;
  scheduleRules: ScheduleRules;
  createdAt: IsoTimestamp;
};

function parseScheduleRules(value: unknown): ScheduleRules {
  if (typeof value === 'string') {
    return scheduleRulesSchema.parse(JSON.parse(value));
  }

  return scheduleRulesSchema.parse(value);
}

function toTask(row: typeof tasksTable.$inferSelect): Task {
  return taskSchema.parse({
    ...row,
    schedule_rules: parseScheduleRules(row.schedule_rules),
  });
}

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
  const personIds = persons.map((person) => person.id);

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

  const completions = completionRows.map((row) => taskCompletionSchema.parse(row));

  const [skipDayRow] = await db
    .select()
    .from(skipDaysTable)
    .where(
      and(eq(skipDaysTable.family_id, familyId), eq(skipDaysTable.date, date)),
    )
    .limit(1);

  const streakRows =
    personIds.length === 0
      ? []
      : await db
          .select()
          .from(streaksTable)
          .where(inArray(streaksTable.person_id, personIds));

  return {
    persons,
    tasks,
    completions,
    skipDay: skipDayRow ? skipDaySchema.parse(skipDayRow) : null,
    streaks: streakRows.map((row) => streakSchema.parse(row)),
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
      and(eq(taskCompletionsTable.task_id, taskId), eq(taskCompletionsTable.date, date)),
    );
}
