import { spawn } from 'node:child_process';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { buildLocalSeedSql, martinSeedData } from './seed';

const thisFilePath = fileURLToPath(import.meta.url);
const repoRoot = join(dirname(thisFilePath), '..', '..');

export const seedTargetValues = ['local', 'remote', 'preview'] as const;
export type SeedTarget = (typeof seedTargetValues)[number];

function getWranglerExecutable(): string {
  return process.platform === 'win32' ? 'npm.cmd' : 'npm';
}

function buildWranglerCommand(args: string[]): string[] {
  return ['exec', 'wrangler', '--', ...args];
}

function isSeedTarget(value: string): value is SeedTarget {
  return seedTargetValues.includes(value as SeedTarget);
}

export function parseSeedTargetFromArgs(args: ReadonlyArray<string>): SeedTarget {
  const requestedTargets = args.flatMap((argument) => {
    if (argument === '--local') {
      return ['local'];
    }

    if (argument === '--remote') {
      return ['remote'];
    }

    if (argument === '--preview') {
      return ['preview'];
    }

    const targetMatch = argument.match(/^--target=(local|remote|preview)$/);

    if (targetMatch?.[1] && isSeedTarget(targetMatch[1])) {
      return [targetMatch[1]];
    }

    return [];
  });

  if (requestedTargets.length === 0) {
    return 'local';
  }

  const uniqueTargets = [...new Set(requestedTargets)];

  if (uniqueTargets.length > 1) {
    throw new Error(
      `Conflicting seed targets provided: ${uniqueTargets.join(', ')}.`,
    );
  }

  const [target] = uniqueTargets;

  return target && isSeedTarget(target) ? target : 'local';
}

export function buildWranglerSeedArgs(
  sqlFilePath: string,
  target: SeedTarget,
): string[] {
  const locationFlag =
    target === 'remote'
      ? '--remote'
      : target === 'preview'
        ? '--preview'
        : '--local';

  return ['d1', 'execute', 'DB', locationFlag, '--file', sqlFilePath, '--yes'];
}

async function runWrangler(args: string[]): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    const child = spawn(getWranglerExecutable(), buildWranglerCommand(args), {
      cwd: repoRoot,
      stdio: 'inherit',
    });

    child.once('error', reject);
    child.once('exit', (code) => {
      if (code === 0) {
        resolve();
        return;
      }

      reject(new Error(`wrangler exited with code ${code ?? 'unknown'}`));
    });
  });
}

export async function seedCloudflareDatabase(
  target: SeedTarget = 'local',
): Promise<void> {
  const tempDir = await mkdtemp(join(tmpdir(), 'wedo-d1-seed-'));
  const sqlFile = join(tempDir, 'seed.sql');

  try {
    await writeFile(sqlFile, buildLocalSeedSql(), 'utf8');
    await runWrangler(buildWranglerSeedArgs(sqlFile, target));

    process.stdout.write(
      `Seeded ${target} D1 with ${martinSeedData.persons.length} persons, ${martinSeedData.tasks.length} tasks, and ${martinSeedData.streaks.length} streak rows.\n`,
    );
  } finally {
    await rm(tempDir, { force: true, recursive: true });
  }
}

if (process.argv[1] === thisFilePath) {
  void seedCloudflareDatabase(parseSeedTargetFromArgs(process.argv.slice(2))).catch(
    (error: unknown) => {
      console.error(error);
      process.exitCode = 1;
    },
  );
}
