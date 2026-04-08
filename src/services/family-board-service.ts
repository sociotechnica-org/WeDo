import { getDateForIsoDate } from '@/config/timezone';
import {
  createTaskCompletion,
  getFamilyBoardSourceData,
  getFamilyTask,
  removeTaskCompletion,
  type FamilyBoardSourceData,
} from '@/db/family-board-repository';
import { type DatabaseClient } from '@/db/database';
import {
  getDayCodeForDate as getRecurrenceDayCodeForDate,
  getTasksForDate,
  isTaskScheduledForDate as isScheduleRulesScheduledForDate,
} from '@/services/recurrence';
import {
  familyBoardStateSchema,
  isoTimestampSchema,
  type DayCode,
  type FamilyBoardState,
  type IsoDate,
  type IsoTimestamp,
  type PersonDayState,
  type Streak,
  type Task,
} from '@/types';

type BuildFamilyBoardStateInput = FamilyBoardSourceData & {
  familyId: string;
  date: IsoDate;
};

type ToggleTaskCompletionInput = {
  familyId: string;
  taskId: string;
  date: IsoDate;
  completed: boolean;
  completedAt?: IsoTimestamp;
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
  return getRecurrenceDayCodeForDate(getDateForIsoDate(date));
}

export function isTaskScheduledForDate(task: Task, date: IsoDate): boolean {
  return isScheduleRulesScheduledForDate(
    task.schedule_rules,
    getDateForIsoDate(date),
  );
}

export function buildFamilyBoardState(
  input: BuildFamilyBoardStateInput,
): FamilyBoardState {
  const requestedDay = getDateForIsoDate(input.date);
  const scheduledTasks = getTasksForDate(input.tasks, requestedDay);
  const peopleById = new Map<string, PersonDayState>();
  const streakByPersonId = new Map(
    input.streaks.map((streak) => [streak.person_id, streak] as const),
  );
  const completionByTaskId = new Map(
    input.completions.map((completion) => [completion.task_id, completion] as const),
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
      is_sunday: getRecurrenceDayCodeForDate(requestedDay) === 'SU',
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

  return buildFamilyBoardState({
    ...source,
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

  if (
    !isScheduleRulesScheduledForDate(
      task.schedule_rules,
      getDateForIsoDate(input.date),
    )
  ) {
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
    return;
  }

  await removeTaskCompletion(client, input.taskId, input.date);
}
