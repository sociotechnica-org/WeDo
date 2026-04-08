import { spawn } from 'node:child_process';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { buildLocalSeedSql, martinSeedData } from './seed';

const thisFilePath = fileURLToPath(import.meta.url);
const repoRoot = join(dirname(thisFilePath), '..', '..');

function getWranglerExecutable(): string {
  const executable = process.platform === 'win32' ? 'wrangler.cmd' : 'wrangler';

  return join(repoRoot, 'node_modules', '.bin', executable);
}

async function runWrangler(args: string[]): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    const child = spawn(getWranglerExecutable(), args, {
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

export async function seedLocalDatabase(): Promise<void> {
  const tempDir = await mkdtemp(join(tmpdir(), 'wedo-d1-seed-'));
  const sqlFile = join(tempDir, 'seed.sql');

  try {
    await writeFile(sqlFile, buildLocalSeedSql(), 'utf8');
    await runWrangler(['d1', 'execute', 'DB', '--local', '--file', sqlFile]);

    process.stdout.write(
      `Seeded local D1 with ${martinSeedData.persons.length} persons, ${martinSeedData.tasks.length} tasks, and ${martinSeedData.streaks.length} streak rows.\n`,
    );
  } finally {
    await rm(tempDir, { force: true, recursive: true });
  }
}

if (process.argv[1] === thisFilePath) {
  void seedLocalDatabase().catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  });
}
