import {
  createSkipDay,
  createTask,
  createTaskCompletion,
  getFamilyBoardSourceData,
  getFamilyPerson,
  getFamilyTask,
  removeSkipDay,
  removeTaskCompletion,
  removeTaskWithCompletions,
  type FamilyBoardSourceData,
} from '@/db/family-board-repository';
import { type DatabaseClient } from '@/db/database';
import {
  getDayCodeForIsoDate,
  getTasksForIsoDate,
  isTaskScheduledForIsoDate,
} from '@/services/recurrence';
import {
  getFamilyBoardStreaks,
  syncFamilyCurrentStreaks,
} from '@/services/streak';
import {
  familyBoardStateSchema,
  isoTimestampSchema,
  type DayCode,
  type FamilyBoardState,
  type IsoDate,
  type IsoTimestamp,
  type PersonDayState,
  type ScheduleRules,
  type Streak,
  type Task,
} from '@/types';

type BuildFamilyBoardStateInput = FamilyBoardSourceData & {
  familyId: string;
  date: IsoDate;
  streaks: Streak[];
};

type ToggleTaskCompletionInput = {
  familyId: string;
  taskId: string;
  date: IsoDate;
  completed: boolean;
  completedAt?: IsoTimestamp;
};

type CreateTaskInput = {
  familyId: string;
  personId: string;
  title: string;
  emoji: string;
  scheduleRules: ScheduleRules;
  createdAt?: IsoTimestamp;
};

type ToggleSkipDayInput = {
  familyId: string;
  date: IsoDate;
  skipped: boolean;
  createdAt?: IsoTimestamp;
};

type DeleteTaskInput = {
  familyId: string;
  taskId: string;
};

export class FamilyBoardStateError extends Error {}

function getDefaultStreak(personId: string): Streak {
  return {
    person_id: personId,
    current_count: 0,
    best_count: 0,
    last_qualifying_date: null,
  };
}

export function getDayCodeForDate(date: IsoDate): DayCode {
  return getDayCodeForIsoDate(date);
}

export function isTaskScheduledForDate(task: Task, date: IsoDate): boolean {
  return isTaskScheduledForIsoDate(task.schedule_rules, date);
}

export function buildFamilyBoardState(
  input: BuildFamilyBoardStateInput,
): FamilyBoardState {
  const scheduledTasks = getTasksForIsoDate(input.tasks, input.date);
  const peopleById = new Map<string, PersonDayState>();
  const streakByPersonId = new Map(
    input.streaks.map((streak) => [streak.person_id, streak] as const),
  );
  const completionByTaskId = new Map(
    input.completions.map(
      (completion) => [completion.task_id, completion] as const,
    ),
  );

  const people = input.persons.map((person) => {
    const personState: PersonDayState = {
      person,
      streak: streakByPersonId.get(person.id) ?? getDefaultStreak(person.id),
      skip_day: input.skipDay,
      tasks: [],
    };

    peopleById.set(person.id, personState);

    return personState;
  });

  for (const task of scheduledTasks) {
    const personState = peopleById.get(task.person_id);

    if (!personState) {
      continue;
    }

    personState.tasks.push({
      task,
      completion: completionByTaskId.get(task.id) ?? null,
    });
  }

  if (people.length === 0) {
    throw new FamilyBoardStateError(
      `Family ${input.familyId} has no people and cannot produce board state.`,
    );
  }

  return familyBoardStateSchema.parse({
    family_id: input.familyId,
    day: {
      date: input.date,
      is_sunday: getDayCodeForIsoDate(input.date) === 'SU',
    },
    people,
  });
}

export async function getFamilyBoardState(
  client: DatabaseClient,
  familyId: string,
  date: IsoDate,
): Promise<FamilyBoardState> {
  const source = await getFamilyBoardSourceData(client, familyId, date);
  const streaks = await getFamilyBoardStreaks(client, familyId, date);

  return buildFamilyBoardState({
    ...source,
    streaks,
    familyId,
    date,
  });
}

function getCompletedAtTimestamp(value?: IsoTimestamp): IsoTimestamp {
  if (value) {
    return value;
  }

  return isoTimestampSchema.parse(new Date().toISOString());
}

function getCreatedAtTimestamp(value?: IsoTimestamp): IsoTimestamp {
  if (value) {
    return value;
  }

  return isoTimestampSchema.parse(new Date().toISOString());
}

export async function createRecurringTask(
  client: DatabaseClient,
  input: CreateTaskInput,
): Promise<Task> {
  const person = await getFamilyPerson(client, input.familyId, input.personId);

  if (!person) {
    throw new FamilyBoardStateError(
      `Person ${input.personId} does not belong to family ${input.familyId}.`,
    );
  }

  return await createTask(client, {
    familyId: input.familyId,
    personId: input.personId,
    title: input.title,
    emoji: input.emoji,
    scheduleRules: input.scheduleRules,
    createdAt: getCreatedAtTimestamp(input.createdAt),
  });
}

export async function toggleTaskCompletion(
  client: DatabaseClient,
  input: ToggleTaskCompletionInput,
): Promise<void> {
  const task = await getFamilyTask(client, input.familyId, input.taskId);

  if (!task) {
    throw new FamilyBoardStateError(
      `Task ${input.taskId} does not belong to family ${input.familyId}.`,
    );
  }

  if (!isTaskScheduledForIsoDate(task.schedule_rules, input.date)) {
    throw new FamilyBoardStateError(
      `Task ${input.taskId} is not scheduled for ${input.date}.`,
    );
  }

  if (input.completed) {
    await createTaskCompletion(client, {
      taskId: input.taskId,
      date: input.date,
      completedAt: getCompletedAtTimestamp(input.completedAt),
    });
  } else {
    await removeTaskCompletion(client, input.taskId, input.date);
  }

  await syncFamilyCurrentStreaks(client, input.familyId, { force: true });
}

export async function toggleSkipDay(
  client: DatabaseClient,
  input: ToggleSkipDayInput,
): Promise<void> {
  if (input.skipped) {
    await createSkipDay(client, {
      familyId: input.familyId,
      date: input.date,
      createdAt: getCreatedAtTimestamp(input.createdAt),
    });
  } else {
    await removeSkipDay(client, input.familyId, input.date);
  }

  await syncFamilyCurrentStreaks(client, input.familyId, { force: true });
}

export async function deleteTask(
  client: DatabaseClient,
  input: DeleteTaskInput,
): Promise<void> {
  const task = await getFamilyTask(client, input.familyId, input.taskId);

  if (!task) {
    throw new FamilyBoardStateError(
      `Task ${input.taskId} does not belong to family ${input.familyId}.`,
    );
  }

  await removeTaskWithCompletions(client, input.familyId, input.taskId);
  await syncFamilyCurrentStreaks(client, input.familyId, { force: true });
}
