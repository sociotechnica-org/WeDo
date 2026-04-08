import { sql } from 'drizzle-orm';
import {
  check,
  foreignKey,
  index,
  integer,
  sqliteTable,
  text,
  uniqueIndex,
} from 'drizzle-orm/sqlite-core';
import type { ScheduleRules } from '../types/shared';

export const personsTable = sqliteTable(
  'persons',
  {
    id: text('id').primaryKey(),
    family_id: text('family_id').notNull(),
    name: text('name').notNull(),
    display_order: integer('display_order').notNull(),
    emoji: text('emoji').notNull(),
  },
  (table) => [
    uniqueIndex('persons_family_display_order_unique').on(
      table.family_id,
      table.display_order,
    ),
    uniqueIndex('persons_family_id_id_unique').on(table.family_id, table.id),
    uniqueIndex('persons_family_name_unique').on(table.family_id, table.name),
    check(
      'persons_display_order_nonnegative',
      sql`${table.display_order} >= 0`,
    ),
  ],
);

export const tasksTable = sqliteTable(
  'tasks',
  {
    id: text('id').primaryKey(),
    family_id: text('family_id').notNull(),
    person_id: text('person_id').notNull(),
    title: text('title').notNull(),
    emoji: text('emoji').notNull(),
    schedule_rules: text('schedule_rules', { mode: 'json' })
      .$type<ScheduleRules>()
      .notNull(),
    created_at: text('created_at').notNull(),
  },
  (table) => [
    index('tasks_family_person_idx').on(table.family_id, table.person_id),
    foreignKey({
      columns: [table.family_id, table.person_id],
      foreignColumns: [personsTable.family_id, personsTable.id],
      name: 'tasks_family_person_fk',
    }).onDelete('cascade'),
    check(
      'tasks_schedule_rules_json_valid',
      sql`json_valid(${table.schedule_rules})`,
    ),
  ],
);

export const taskCompletionsTable = sqliteTable(
  'task_completions',
  {
    id: text('id').primaryKey(),
    task_id: text('task_id')
      .notNull()
      .references(() => tasksTable.id, { onDelete: 'cascade' }),
    date: text('date').notNull(),
    completed_at: text('completed_at').notNull(),
  },
  (table) => [
    uniqueIndex('task_completions_task_date_unique').on(
      table.task_id,
      table.date,
    ),
    index('task_completions_date_idx').on(table.date),
  ],
);

export const skipDaysTable = sqliteTable(
  'skip_days',
  {
    id: text('id').primaryKey(),
    family_id: text('family_id').notNull(),
    date: text('date').notNull(),
    reason: text('reason'),
    created_at: text('created_at').notNull(),
  },
  (table) => [
    uniqueIndex('skip_days_family_date_unique').on(table.family_id, table.date),
  ],
);

export const streaksTable = sqliteTable(
  'streaks',
  {
    person_id: text('person_id')
      .primaryKey()
      .references(() => personsTable.id, { onDelete: 'cascade' }),
    current_count: integer('current_count').notNull(),
    best_count: integer('best_count').notNull(),
    last_qualifying_date: text('last_qualifying_date'),
  },
  (table) => [
    check(
      'streaks_current_count_nonnegative',
      sql`${table.current_count} >= 0`,
    ),
    check('streaks_best_count_nonnegative', sql`${table.best_count} >= 0`),
  ],
);

export const schema = {
  persons: personsTable,
  tasks: tasksTable,
  task_completions: taskCompletionsTable,
  skip_days: skipDaysTable,
  streaks: streaksTable,
};

export type PersonRow = typeof personsTable.$inferSelect;
export type NewPersonRow = typeof personsTable.$inferInsert;
export type TaskRow = typeof tasksTable.$inferSelect;
export type NewTaskRow = typeof tasksTable.$inferInsert;
export type TaskCompletionRow = typeof taskCompletionsTable.$inferSelect;
export type NewTaskCompletionRow = typeof taskCompletionsTable.$inferInsert;
export type SkipDayRow = typeof skipDaysTable.$inferSelect;
export type NewSkipDayRow = typeof skipDaysTable.$inferInsert;
export type StreakRow = typeof streaksTable.$inferSelect;
export type NewStreakRow = typeof streaksTable.$inferInsert;
