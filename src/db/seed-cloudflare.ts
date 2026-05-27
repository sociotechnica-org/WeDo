import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import {
  buildBootstrapSeedSql,
  buildLocalSeedSql,
  martinSeedData,
} from './seed';

const thisFilePath = fileURLToPath(import.meta.url);
const repoRoot = join(dirname(thisFilePath), '..', '..');

export const seedTargetValues = ['local', 'remote', 'preview'] as const;
export type SeedTarget = (typeof seedTargetValues)[number];
export const seedModeValues = ['bootstrap', 'reset'] as const;
export type SeedMode = (typeof seedModeValues)[number];

export type SeedOptions = {
  mode: SeedMode;
  target: SeedTarget;
};

type BuildWranglerCommandOptions = {
  localWranglerPath?: string;
  localWranglerExists?: (path: string) => boolean;
};

function getLocalWranglerPath(): string {
  return join(
    repoRoot,
    'node_modules',
    '.bin',
    process.platform === 'win32' ? 'wrangler.cmd' : 'wrangler',
  );
}

export function buildWranglerCommand(
  args: string[],
  options: BuildWranglerCommandOptions = {},
): {
  args: string[];
  command: string;
} {
  const localWranglerPath = options.localWranglerPath ?? getLocalWranglerPath();
  const localWranglerExists = options.localWranglerExists ?? existsSync;

  if (localWranglerExists(localWranglerPath)) {
    return {
      command: localWranglerPath,
      args,
    };
  }

  return {
    command: process.platform === 'win32' ? 'npm.cmd' : 'npm',
    args: ['exec', 'wrangler', '--', ...args],
  };
}

function isSeedTarget(value: string): value is SeedTarget {
  return seedTargetValues.includes(value as SeedTarget);
}

function isSeedMode(value: string): value is SeedMode {
  return seedModeValues.includes(value as SeedMode);
}

export function getDefaultSeedModeForTarget(target: SeedTarget): SeedMode {
  return target === 'local' ? 'reset' : 'bootstrap';
}

export function parseSeedTargetFromArgs(
  args: ReadonlyArray<string>,
): SeedTarget {
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

export function parseSeedOptionsFromArgs(
  args: ReadonlyArray<string>,
): SeedOptions {
  const target = parseSeedTargetFromArgs(args);
  const requestedModes = args.flatMap((argument) => {
    if (argument === '--bootstrap') {
      return ['bootstrap'];
    }

    if (argument === '--reset') {
      return ['reset'];
    }

    const modeMatch = argument.match(/^--mode=(bootstrap|reset)$/);

    if (modeMatch?.[1] && isSeedMode(modeMatch[1])) {
      return [modeMatch[1]];
    }

    return [];
  });

  const uniqueModes = [...new Set(requestedModes)];

  if (uniqueModes.length > 1) {
    throw new Error(
      `Conflicting seed modes provided: ${uniqueModes.join(', ')}.`,
    );
  }

  const [requestedMode] = uniqueModes;
  const mode =
    requestedMode && isSeedMode(requestedMode)
      ? requestedMode
      : getDefaultSeedModeForTarget(target);

  if (mode === 'reset' && target !== 'local') {
    throw new Error('Reset seed mode is only available for local D1.');
  }

  return {
    mode,
    target,
  };
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

export function buildSeedSqlForTarget(
  target: SeedTarget,
  mode: SeedMode = getDefaultSeedModeForTarget(target),
): string {
  if (mode === 'reset' && target !== 'local') {
    throw new Error('Reset seed mode is only available for local D1.');
  }

  return mode === 'reset' ? buildLocalSeedSql() : buildBootstrapSeedSql();
}

async function runWrangler(args: string[]): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    const invocation = buildWranglerCommand(args);
    const child = spawn(invocation.command, invocation.args, {
      cwd: repoRoot,
      env: {
        ...process.env,
        CI: process.env.CI ?? '1',
      },
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
  mode: SeedMode = getDefaultSeedModeForTarget(target),
): Promise<void> {
  const tempDir = await mkdtemp(join(tmpdir(), 'wedo-d1-seed-'));
  const sqlFile = join(tempDir, 'seed.sql');

  try {
    await writeFile(sqlFile, buildSeedSqlForTarget(target, mode), 'utf8');
    await runWrangler(buildWranglerSeedArgs(sqlFile, target));

    process.stdout.write(
      `Seeded ${target} D1 in ${mode} mode with ${martinSeedData.persons.length} persons, ${martinSeedData.tasks.length} tasks, and ${martinSeedData.streaks.length} streak rows.\n`,
    );
  } finally {
    await rm(tempDir, { force: true, recursive: true });
  }
}

if (process.argv[1] === thisFilePath) {
  const options = parseSeedOptionsFromArgs(process.argv.slice(2));

  void seedCloudflareDatabase(options.target, options.mode).catch(
    (error: unknown) => {
      console.error(error);
      process.exitCode = 1;
    },
  );
}
