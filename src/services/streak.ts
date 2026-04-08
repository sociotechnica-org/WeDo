import { getIsoDateForTimezone } from '@/config/timezone';
import {
  getFamilyPersistedStreaks,
  getFamilyStreakCalculationSource,
  savePersistedStreaks,
  type FamilyStreakCalculationSource,
  type PersistedStreak,
} from '@/db/streak-repository';
import { type DatabaseClient } from '@/db/database';
import {
  getDayCodeForIsoDate,
  isTaskScheduledForIsoDate,
} from '@/services/recurrence';
import {
  addDaysToIsoDate,
  compareIsoDates,
  isoDateSchema,
  type IsoDate,
  type Streak,
  type Task,
  type TaskCompletion,
} from '@/types';

type StreakComputationOptions = {
  todayDate?: IsoDate;
};

type SyncFamilyCurrentStreaksOptions = StreakComputationOptions & {
  force?: boolean;
};

type StreakDayOutcome = 'hold' | 'increment' | 'reset';

const defaultComputationOptions = (): Required<StreakComputationOptions> => ({
  todayDate: getIsoDateForTimezone(),
});

function getTaskCreationDate(task: Task): IsoDate {
  return isoDateSchema.parse(task.created_at.slice(0, 10));
}

function getDefaultStreak(personId: string): Streak {
  return {
    person_id: personId,
    current_count: 0,
    best_count: 0,
    last_qualifying_date: null,
  };
}

function getEarliestRelevantDate(
  tasks: ReadonlyArray<Task>,
  completions: ReadonlyArray<TaskCompletion>,
  skipDayDates: ReadonlyArray<IsoDate>,
  throughDate: IsoDate,
): IsoDate | null {
  const candidates: IsoDate[] = [];

  for (const task of tasks) {
    const createdDate = getTaskCreationDate(task);

    if (compareIsoDates(createdDate, throughDate) <= 0) {
      candidates.push(createdDate);
    }
  }

  for (const completion of completions) {
    if (compareIsoDates(completion.date, throughDate) <= 0) {
      candidates.push(completion.date);
    }
  }

  for (const skipDayDate of skipDayDates) {
    if (compareIsoDates(skipDayDate, throughDate) <= 0) {
      candidates.push(skipDayDate);
    }
  }

  if (candidates.length === 0) {
    return null;
  }

  return candidates.sort(compareIsoDates)[0] ?? null;
}

function classifyStreakDay(
  date: IsoDate,
  todayDate: IsoDate,
  scheduledTasks: ReadonlyArray<Task>,
  completionTaskIds: ReadonlySet<string>,
  skipDayDates: ReadonlySet<IsoDate>,
): StreakDayOutcome {
  if (compareIsoDates(date, todayDate) > 0) {
    return 'hold';
  }

  if (getDayCodeForIsoDate(date) === 'SU') {
    return 'hold';
  }

  if (skipDayDates.has(date)) {
    return 'hold';
  }

  if (scheduledTasks.length === 0) {
    return 'hold';
  }

  const isComplete = scheduledTasks.every((task) =>
    completionTaskIds.has(task.id),
  );

  if (isComplete) {
    return 'increment';
  }

  return compareIsoDates(date, todayDate) < 0 ? 'reset' : 'hold';
}

export function calculateStreakForPerson(
  personId: string,
  source: Pick<
    FamilyStreakCalculationSource,
    'tasks' | 'completions' | 'skipDayDates'
  >,
  targetDate: IsoDate,
  options: StreakComputationOptions = {},
): Streak {
  const { todayDate } = {
    ...defaultComputationOptions(),
    ...options,
  };
  const throughDate =
    compareIsoDates(targetDate, todayDate) > 0 ? todayDate : targetDate;
  const personTasks = source.tasks.filter(
    (task) => task.person_id === personId,
  );
  const relevantCompletions = source.completions.filter((completion) =>
    personTasks.some((task) => task.id === completion.task_id),
  );
  const earliestDate = getEarliestRelevantDate(
    personTasks,
    relevantCompletions,
    source.skipDayDates,
    throughDate,
  );

  if (!earliestDate) {
    return getDefaultStreak(personId);
  }

  const completionTaskIdsByDate = new Map<IsoDate, Set<string>>();

  for (const completion of relevantCompletions) {
    const taskIds =
      completionTaskIdsByDate.get(completion.date) ?? new Set<string>();

    taskIds.add(completion.task_id);
    completionTaskIdsByDate.set(completion.date, taskIds);
  }

  const skipDayDateSet = new Set(source.skipDayDates);

  let currentCount = 0;
  let bestCount = 0;
  let lastQualifyingDate: IsoDate | null = null;
  let cursor = earliestDate;

  while (compareIsoDates(cursor, throughDate) <= 0) {
    const scheduledTasks = personTasks.filter((task) => {
      if (compareIsoDates(getTaskCreationDate(task), cursor) > 0) {
        return false;
      }

      return isTaskScheduledForIsoDate(task.schedule_rules, cursor);
    });
    const outcome = classifyStreakDay(
      cursor,
      todayDate,
      scheduledTasks,
      completionTaskIdsByDate.get(cursor) ?? new Set<string>(),
      skipDayDateSet,
    );

    if (outcome === 'increment') {
      currentCount += 1;
      bestCount = Math.max(bestCount, currentCount);
      lastQualifyingDate = cursor;
    } else if (outcome === 'reset') {
      currentCount = 0;
    }

    cursor = addDaysToIsoDate(cursor, 1);
  }

  return {
    person_id: personId,
    current_count: currentCount,
    best_count: bestCount,
    last_qualifying_date: lastQualifyingDate,
  };
}

export function calculateFamilyStreaks(
  source: FamilyStreakCalculationSource,
  targetDate: IsoDate,
  options: StreakComputationOptions = {},
): Streak[] {
  return source.persons.map((person) =>
    calculateStreakForPerson(person.id, source, targetDate, options),
  );
}

export async function syncFamilyCurrentStreaks(
  client: DatabaseClient,
  familyId: string,
  options: SyncFamilyCurrentStreaksOptions = {},
): Promise<void> {
  const { force = false, todayDate } = {
    ...defaultComputationOptions(),
    ...options,
  };
  const persisted = await getFamilyPersistedStreaks(client, familyId);

  if (
    !force &&
    persisted.length > 0 &&
    persisted.every((streak) => streak.evaluated_through_date === todayDate)
  ) {
    return;
  }

  const source = await getFamilyStreakCalculationSource(
    client,
    familyId,
    todayDate,
  );
  const streaks = calculateFamilyStreaks(source, todayDate, {
    todayDate,
  });

  await savePersistedStreaks(
    client,
    streaks.map(
      (streak): PersistedStreak => ({
        ...streak,
        evaluated_through_date: todayDate,
      }),
    ),
  );
}

export async function getFamilyBoardStreaks(
  client: DatabaseClient,
  familyId: string,
  requestedDate: IsoDate,
  options: StreakComputationOptions = {},
): Promise<Streak[]> {
  const { todayDate } = {
    ...defaultComputationOptions(),
    ...options,
  };

  await syncFamilyCurrentStreaks(client, familyId, {
    todayDate,
  });

  if (compareIsoDates(requestedDate, todayDate) >= 0) {
    const persisted = await getFamilyPersistedStreaks(client, familyId);

    return persisted.map((streak) => ({
      person_id: streak.person_id,
      current_count: streak.current_count,
      best_count: streak.best_count,
      last_qualifying_date: streak.last_qualifying_date,
    }));
  }

  const source = await getFamilyStreakCalculationSource(
    client,
    familyId,
    requestedDate,
  );

  return calculateFamilyStreaks(source, requestedDate, {
    todayDate,
  });
}
