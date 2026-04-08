import {
  personSchema,
  scheduleRulesSchema,
  streakSchema,
  taskSchema,
  type Person,
  type ScheduleRules,
  type Streak,
  type Task,
} from '../types';
import { getDatabase, type DatabaseClient } from './database';
import { personsTable, streaksTable, tasksTable } from './schema';

export const martinFamilyId = '2b95f346-f41d-4c78-8ec6-bd37ec0117b4';
const seedCreatedAt = '2026-04-08T00:00:00Z';
const jessId = '8afb19dd-44f4-4ab4-bff7-754dc9f4ccfd';
const elizabethId = 'fc744c89-bcef-4d16-92a0-5d2d15ec7004';
const micahId = 'd67f7234-5bf4-43ae-8d14-6607d2902c5e';
const moriahId = 'd0a1efa7-89f3-4db7-97b4-1eb1d2d24304';
const wellsId = 'bc7f51da-cb0e-4a17-b18d-c42cf2c9cf99';
const coraId = 'f35fb56b-f899-4258-b680-cf7a5ecf3106';

const martinPersonRecords = [
  {
    id: jessId,
    family_id: martinFamilyId,
    name: 'Jess',
    display_order: 0,
    emoji: '🌿',
  },
  {
    id: elizabethId,
    family_id: martinFamilyId,
    name: 'Elizabeth',
    display_order: 1,
    emoji: '🌼',
  },
  {
    id: micahId,
    family_id: martinFamilyId,
    name: 'Micah',
    display_order: 2,
    emoji: '⚽',
  },
  {
    id: moriahId,
    family_id: martinFamilyId,
    name: 'Moriah',
    display_order: 3,
    emoji: '🎨',
  },
  {
    id: wellsId,
    family_id: martinFamilyId,
    name: 'Wells',
    display_order: 4,
    emoji: '🚲',
  },
  {
    id: coraId,
    family_id: martinFamilyId,
    name: 'Cora',
    display_order: 5,
    emoji: '🦋',
  },
] satisfies ReadonlyArray<Person>;

const weekdaySchedule = scheduleRulesSchema.parse({
  days: ['MO', 'TU', 'WE', 'TH', 'FR'],
});

const mondayThroughSaturdaySchedule = scheduleRulesSchema.parse({
  days: ['MO', 'TU', 'WE', 'TH', 'FR', 'SA'],
});

const schoolDaysSchedule = scheduleRulesSchema.parse({
  days: ['MO', 'TU', 'TH', 'FR'],
});

const saturdayOnlySchedule = scheduleRulesSchema.parse({
  days: ['SA'],
});

const martinTaskRecords = [
  {
    id: '8b7c6fc3-1fe3-4e85-a76e-49f15fca5fd8',
    family_id: martinFamilyId,
    person_id: jessId,
    title: 'Kitchen reset',
    emoji: '🍽️',
    schedule_rules: mondayThroughSaturdaySchedule,
    created_at: seedCreatedAt,
  },
  {
    id: '9411d809-bab8-4f1c-9977-36b0e5fd29e4',
    family_id: martinFamilyId,
    person_id: elizabethId,
    title: 'Laundry reset',
    emoji: '🧺',
    schedule_rules: weekdaySchedule,
    created_at: seedCreatedAt,
  },
  {
    id: 'c6341f88-6e65-4701-a285-34cf3ab52f4f',
    family_id: martinFamilyId,
    person_id: micahId,
    title: 'Practice piano',
    emoji: '🎹',
    schedule_rules: schoolDaysSchedule,
    created_at: seedCreatedAt,
  },
  {
    id: '04c033b4-7418-4f58-8dfc-a5c2ca5b8ad2',
    family_id: martinFamilyId,
    person_id: micahId,
    title: 'Schoolwork',
    emoji: '📚',
    schedule_rules: schoolDaysSchedule,
    created_at: seedCreatedAt,
  },
  {
    id: '8dca69cc-3223-4f6f-a8aa-1dd762f213e8',
    family_id: martinFamilyId,
    person_id: moriahId,
    title: 'Practice piano',
    emoji: '🎼',
    schedule_rules: schoolDaysSchedule,
    created_at: seedCreatedAt,
  },
  {
    id: 'd8602f40-c7b3-4fcb-a936-ce47879d474a',
    family_id: martinFamilyId,
    person_id: moriahId,
    title: 'Schoolwork',
    emoji: '📝',
    schedule_rules: schoolDaysSchedule,
    created_at: seedCreatedAt,
  },
  {
    id: '7dfa6859-3428-4110-b4b3-1704773385f3',
    family_id: martinFamilyId,
    person_id: wellsId,
    title: 'Vacuum',
    emoji: '🧹',
    schedule_rules: mondayThroughSaturdaySchedule,
    created_at: seedCreatedAt,
  },
  {
    id: 'eb08e48f-16f7-46b7-8ff3-ec2d0e6184df',
    family_id: martinFamilyId,
    person_id: wellsId,
    title: 'Reading practice',
    emoji: '📖',
    schedule_rules: schoolDaysSchedule,
    created_at: seedCreatedAt,
  },
  {
    id: '4e8ecb7b-14d7-41fb-a073-992d61478503',
    family_id: martinFamilyId,
    person_id: coraId,
    title: 'Morning chores',
    emoji: '🌞',
    schedule_rules: mondayThroughSaturdaySchedule,
    created_at: seedCreatedAt,
  },
  {
    id: '0ba7f453-a573-47a6-9cd4-cd763015b2db',
    family_id: martinFamilyId,
    person_id: coraId,
    title: 'Toy pickup',
    emoji: '🧸',
    schedule_rules: saturdayOnlySchedule,
    created_at: seedCreatedAt,
  },
] satisfies ReadonlyArray<Task>;

const martinStreakRecords = martinPersonRecords.map((person) =>
  streakSchema.parse({
    person_id: person.id,
    current_count: 0,
    best_count: 0,
    last_qualifying_date: null,
  }),
);

export const martinFamilyPersons = martinPersonRecords.map((person) =>
  personSchema.parse(person),
);

export const martinFamilyTasks = martinTaskRecords.map((task) =>
  taskSchema.parse(task),
);

export const martinFamilyStreaks =
  martinStreakRecords satisfies ReadonlyArray<Streak>;

export const martinSeedData = {
  family_id: martinFamilyId,
  persons: martinFamilyPersons,
  tasks: martinFamilyTasks,
  task_completions: [] as const,
  skip_days: [] as const,
  streaks: martinFamilyStreaks,
};

type SeedSqlValue = null | number | string | boolean | ScheduleRules;

function toSqlLiteral(value: SeedSqlValue): string {
  if (value === null) {
    return 'NULL';
  }

  if (typeof value === 'number') {
    return Number.isFinite(value) ? String(value) : 'NULL';
  }

  if (typeof value === 'boolean') {
    return value ? '1' : '0';
  }

  const textValue = typeof value === 'string' ? value : JSON.stringify(value);

  return `'${textValue.replaceAll("'", "''")}'`;
}

function buildInsertStatement(
  tableName: string,
  rows: ReadonlyArray<Record<string, SeedSqlValue>>,
): string {
  const [firstRow] = rows;

  if (!firstRow) {
    return '';
  }

  const columns = Object.keys(firstRow);
  const values = rows
    .map(
      (row) =>
        `(${columns.map((column) => toSqlLiteral(row[column] ?? null)).join(', ')})`,
    )
    .join(',\n');

  return [
    `INSERT OR IGNORE INTO \`${tableName}\` (${columns.map((column) => `\`${column}\``).join(', ')})`,
    `VALUES ${values};`,
  ].join('\n');
}

export function buildLocalSeedSql(): string {
  return [
    buildInsertStatement('persons', martinFamilyPersons),
    buildInsertStatement('tasks', martinFamilyTasks),
    buildInsertStatement('streaks', martinFamilyStreaks),
  ]
    .filter((statement) => statement.length > 0)
    .join('\n\n');
}

export async function seedDatabase(client: DatabaseClient): Promise<void> {
  const db = getDatabase(client);

  await db
    .insert(personsTable)
    .values(martinFamilyPersons)
    .onConflictDoNothing();

  await db.insert(tasksTable).values(martinFamilyTasks).onConflictDoNothing();

  await db
    .insert(streaksTable)
    .values(martinFamilyStreaks)
    .onConflictDoNothing();
}
