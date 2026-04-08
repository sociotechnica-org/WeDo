import { readFileSync, readdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import {
  personSchema,
  streakSchema,
  taskSchema,
  type Person,
  type Streak,
  type Task,
} from '@/types';
import {
  buildBootstrapSeedSql,
  martinFamilyId,
  martinFamilyPersons,
  martinFamilyStreaks,
  martinFamilyTasks,
  buildLocalSeedSql,
  martinSeedData,
} from '@/db/seed';

const projectRoot = resolve(
  dirname(fileURLToPath(import.meta.url)),
  '../../..',
);
const migrationSqlFiles = readdirSync(resolve(projectRoot, 'src/db/migrations'))
  .filter((entry) => entry.endsWith('.sql'))
  .sort();
const nodeSqliteModule = await import('node:sqlite').catch(() => null);
const DatabaseSync = nodeSqliteModule?.DatabaseSync ?? null;

function applyMigration(db: { exec: (sql: string) => void }): void {
  for (const migrationFile of migrationSqlFiles) {
    const migrationSql = readFileSync(
      resolve(projectRoot, 'src/db/migrations', migrationFile),
      'utf8',
    );

    for (const statement of migrationSql
      .split('--> statement-breakpoint')
      .map((part) => part.trim())
      .filter((part) => part.length > 0)) {
      db.exec(statement);
    }
  }
}

describe('db seed data', () => {
  it('seeds the Martin household persons in stable display order', () => {
    expect(martinSeedData.family_id).toBe(martinFamilyId);
    expect(martinFamilyPersons).toHaveLength(6);

    const displayOrder = martinFamilyPersons.map(
      (person) => person.display_order,
    );

    expect(displayOrder).toEqual([0, 1, 2, 3, 4, 5]);
    expect(new Set(displayOrder).size).toBe(martinFamilyPersons.length);
    expect(martinFamilyPersons.map((person) => person.name)).toEqual([
      'Jess',
      'Elizabeth',
      'Micah',
      'Moriah',
      'Wells',
      'Cora',
    ]);

    for (const person of martinFamilyPersons) {
      expect(personSchema.parse(person)).toEqual(person);
    }
  });

  it('seeds representative recurring tasks with valid schedule rules', () => {
    expect(martinFamilyTasks.length).toBeGreaterThanOrEqual(8);
    expect(martinFamilyTasks.length).toBeLessThanOrEqual(12);

    const personIds = new Set(martinFamilyPersons.map((person) => person.id));
    const assigneeCoverage = new Set(
      martinFamilyTasks.map((task) => task.person_id),
    );

    expect(assigneeCoverage.size).toBeGreaterThanOrEqual(5);

    for (const task of martinFamilyTasks) {
      expect(task.family_id).toBe(martinFamilyId);
      expect(personIds.has(task.person_id)).toBe(true);
      expect(taskSchema.parse(task)).toEqual(task);
    }
  });

  it('starts with empty completions and skip days plus zeroed streaks', () => {
    expect(martinSeedData.task_completions).toEqual([]);
    expect(martinSeedData.skip_days).toEqual([]);
    expect(martinFamilyStreaks).toHaveLength(martinFamilyPersons.length);

    for (const streak of martinFamilyStreaks) {
      expect(streakSchema.parse(streak)).toEqual(streak);
      expect(streak.current_count).toBe(0);
      expect(streak.best_count).toBe(0);
      expect(streak.last_qualifying_date).toBeNull();
    }
  });

  it('keeps the exported seed collections aligned to the contract types', () => {
    const persons: Person[] = martinFamilyPersons;
    const tasks: Task[] = martinFamilyTasks;
    const streaks: Streak[] = martinFamilyStreaks;

    expect(persons).toHaveLength(6);
    expect(tasks.length).toBeGreaterThan(0);
    expect(streaks).toHaveLength(6);
  });
});

const describeNodeSqlite = DatabaseSync ? describe : describe.skip;

describeNodeSqlite('db seed SQL path', () => {
  it('provides a non-destructive bootstrap SQL path for remote D1', () => {
    const Database = DatabaseSync;

    if (!Database) {
      throw new Error('node:sqlite is unavailable in this runtime.');
    }

    const db = new Database(':memory:');
    db.exec('PRAGMA foreign_keys = ON;');
    applyMigration(db);

    db.exec(`
      INSERT INTO persons (
        id,
        family_id,
        name,
        display_order,
        emoji
      ) VALUES (
        'other-person',
        'other-family',
        'Neighbor',
        0,
        '🏠'
      );
    `);

    const seedSql = buildBootstrapSeedSql();

    expect(seedSql).not.toContain('DELETE FROM');

    db.exec(seedSql);
    db.exec(seedSql);

    const personCount = db
      .prepare('SELECT COUNT(*) AS count FROM persons')
      .get() as { count: number };
    const martinPersonCount = db
      .prepare(
        'SELECT COUNT(*) AS count FROM persons WHERE family_id = ?',
      )
      .get(martinFamilyId) as { count: number };

    expect(personCount.count).toBe(martinFamilyPersons.length + 1);
    expect(martinPersonCount.count).toBe(martinFamilyPersons.length);
  });

  it('provides a runnable SQL seed path that is idempotent for local D1', () => {
    const Database = DatabaseSync;

    if (!Database) {
      throw new Error('node:sqlite is unavailable in this runtime.');
    }

    const db = new Database(':memory:');
    db.exec('PRAGMA foreign_keys = ON;');
    applyMigration(db);

    const seedSql = buildLocalSeedSql();

    db.exec(seedSql);
    db.exec(seedSql);

    const personCount = db
      .prepare('SELECT COUNT(*) AS count FROM persons')
      .get() as { count: number };
    const taskCount = db
      .prepare('SELECT COUNT(*) AS count FROM tasks')
      .get() as { count: number };
    const streakCount = db
      .prepare('SELECT COUNT(*) AS count FROM streaks')
      .get() as { count: number };

    expect(personCount.count).toBe(martinFamilyPersons.length);
    expect(taskCount.count).toBe(martinFamilyTasks.length);
    expect(streakCount.count).toBe(martinFamilyStreaks.length);
  });

  it('restores the canonical household after local settings mutations', () => {
    const Database = DatabaseSync;

    if (!Database) {
      throw new Error('node:sqlite is unavailable in this runtime.');
    }

    const db = new Database(':memory:');
    db.exec('PRAGMA foreign_keys = ON;');
    applyMigration(db);
    db.exec(buildLocalSeedSql());

    db.exec(`
      DELETE FROM persons WHERE name = 'Wells';
      UPDATE persons
      SET name = 'Ada', display_order = 5
      WHERE name = 'Cora';
    `);

    db.exec(buildLocalSeedSql());

    const people = db
      .prepare('SELECT name FROM persons ORDER BY display_order')
      .all() as Array<{ name: string }>;
    const taskCount = db
      .prepare('SELECT COUNT(*) AS count FROM tasks')
      .get() as { count: number };
    const streakCount = db
      .prepare('SELECT COUNT(*) AS count FROM streaks')
      .get() as { count: number };

    expect(people.map((person) => person.name)).toEqual(
      martinFamilyPersons.map((person) => person.name),
    );
    expect(taskCount.count).toBe(martinFamilyTasks.length);
    expect(streakCount.count).toBe(martinFamilyStreaks.length);
  });

  it('enforces that seeded tasks stay in the same family as their assignee', () => {
    const Database = DatabaseSync;

    if (!Database) {
      throw new Error('node:sqlite is unavailable in this runtime.');
    }

    const db = new Database(':memory:');
    db.exec('PRAGMA foreign_keys = ON;');
    applyMigration(db);
    db.exec(buildLocalSeedSql());

    const assignee = martinFamilyPersons[0];

    expect(assignee).toBeDefined();
    expect(() =>
      db.exec(`
        INSERT INTO tasks (
          id,
          family_id,
          person_id,
          title,
          emoji,
          schedule_rules,
          created_at
        ) VALUES (
          'invalid-task',
          'other-family',
          '${assignee?.id}',
          'Broken invariant',
          '⚠️',
          '{"days":["MO"]}',
          '2026-04-08T00:00:00Z'
        );
      `),
    ).toThrow(/foreign key/i);
  });
});
