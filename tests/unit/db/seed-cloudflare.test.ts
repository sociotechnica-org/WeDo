import { describe, expect, it } from 'vitest';
import {
  buildWranglerCommand,
  buildSeedSqlForTarget,
  buildWranglerSeedArgs,
  parseSeedTargetFromArgs,
} from '@/db/seed-cloudflare';

describe('seed cloudflare target parsing', () => {
  it('defaults to the local seed target', () => {
    expect(parseSeedTargetFromArgs([])).toBe('local');
  });

  it('accepts explicit remote and preview flags', () => {
    expect(parseSeedTargetFromArgs(['--remote'])).toBe('remote');
    expect(parseSeedTargetFromArgs(['--preview'])).toBe('preview');
  });

  it('accepts --target for script callers that prefer key-value flags', () => {
    expect(parseSeedTargetFromArgs(['--target=local'])).toBe('local');
    expect(parseSeedTargetFromArgs(['--target=remote'])).toBe('remote');
  });

  it('rejects conflicting target flags', () => {
    expect(() =>
      parseSeedTargetFromArgs(['--local', '--remote']),
    ).toThrowError(/conflicting seed targets/i);
  });
});

describe('seed cloudflare wrangler arguments', () => {
  it('builds the local seed execution command', () => {
    expect(buildWranglerSeedArgs('/tmp/seed.sql', 'local')).toEqual([
      'd1',
      'execute',
      'DB',
      '--local',
      '--file',
      '/tmp/seed.sql',
      '--yes',
    ]);
  });

  it('builds the correct location flags for remote targets', () => {
    expect(buildWranglerSeedArgs('/tmp/seed.sql', 'remote')).toContain(
      '--remote',
    );
    expect(buildWranglerSeedArgs('/tmp/seed.sql', 'preview')).toContain(
      '--preview',
    );
  });
});

describe('seed cloudflare wrangler invocation', () => {
  it('falls back to npm exec when no local wrangler binary is present', () => {
    expect(buildWranglerCommand(['--version'])).toEqual({
      command: process.platform === 'win32' ? 'npm.cmd' : 'npm',
      args: ['exec', 'wrangler', '--', '--version'],
    });
  });
});

describe('seed cloudflare SQL selection', () => {
  it('keeps local seeding destructive for reset workflows', () => {
    expect(buildSeedSqlForTarget('local')).toContain('DELETE FROM `persons`;');
  });

  it('keeps remote and preview seeding non-destructive', () => {
    expect(buildSeedSqlForTarget('remote')).not.toContain('DELETE FROM');
    expect(buildSeedSqlForTarget('preview')).not.toContain('DELETE FROM');
  });
});
