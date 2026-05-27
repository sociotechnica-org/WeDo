import { describe, expect, it } from 'vitest';
import {
  buildWranglerCommand,
  buildSeedSqlForTarget,
  buildWranglerSeedArgs,
  parseSeedOptionsFromArgs,
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
    expect(() => parseSeedTargetFromArgs(['--local', '--remote'])).toThrowError(
      /conflicting seed targets/i,
    );
  });
});

describe('seed cloudflare mode parsing', () => {
  it('keeps local seed reset as the default for explicit reset workflows', () => {
    expect(parseSeedOptionsFromArgs([])).toEqual({
      mode: 'reset',
      target: 'local',
    });
  });

  it('accepts a non-destructive local bootstrap mode for dev setup', () => {
    expect(parseSeedOptionsFromArgs(['--local', '--bootstrap'])).toEqual({
      mode: 'bootstrap',
      target: 'local',
    });
    expect(
      parseSeedOptionsFromArgs(['--target=local', '--mode=bootstrap']),
    ).toEqual({
      mode: 'bootstrap',
      target: 'local',
    });
  });

  it('defaults remote and preview seed targets to bootstrap mode', () => {
    expect(parseSeedOptionsFromArgs(['--remote'])).toEqual({
      mode: 'bootstrap',
      target: 'remote',
    });
    expect(parseSeedOptionsFromArgs(['--preview'])).toEqual({
      mode: 'bootstrap',
      target: 'preview',
    });
  });

  it('rejects conflicting seed modes', () => {
    expect(() =>
      parseSeedOptionsFromArgs(['--bootstrap', '--reset']),
    ).toThrowError(/conflicting seed modes/i);
  });

  it('rejects destructive remote seed requests', () => {
    expect(() =>
      parseSeedOptionsFromArgs(['--remote', '--reset']),
    ).toThrowError(/only available for local d1/i);
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
    expect(
      buildWranglerCommand(['--version'], {
        localWranglerPath: '/definitely/not/a/wrangler/binary',
      }),
    ).toEqual({
      command: process.platform === 'win32' ? 'npm.cmd' : 'npm',
      args: ['exec', 'wrangler', '--', '--version'],
    });
  });

  it('prefers the local wrangler binary when it is installed', () => {
    const localWranglerPath =
      process.platform === 'win32'
        ? 'C:\\repo\\node_modules\\.bin\\wrangler.cmd'
        : '/repo/node_modules/.bin/wrangler';
    const invocation = buildWranglerCommand(['--version'], {
      localWranglerPath,
      localWranglerExists: () => true,
    });

    expect(invocation.args).toEqual(['--version']);
    expect(invocation.command).toBe(localWranglerPath);
    expect(invocation.command).toMatch(/wrangler(\.cmd)?$/);
  });
});

describe('seed cloudflare SQL selection', () => {
  it('keeps local seeding destructive for reset workflows', () => {
    expect(buildSeedSqlForTarget('local')).toContain('DELETE FROM `persons`;');
    expect(buildSeedSqlForTarget('local', 'reset')).toContain(
      'DELETE FROM `persons`;',
    );
  });

  it('supports non-destructive local bootstrap seeding for dev setup', () => {
    expect(buildSeedSqlForTarget('local', 'bootstrap')).not.toContain(
      'DELETE FROM',
    );
  });

  it('keeps remote and preview seeding non-destructive', () => {
    expect(buildSeedSqlForTarget('remote')).not.toContain('DELETE FROM');
    expect(buildSeedSqlForTarget('preview')).not.toContain('DELETE FROM');
  });

  it('does not allow destructive reset SQL for remote targets', () => {
    expect(() => buildSeedSqlForTarget('remote', 'reset')).toThrowError(
      /only available for local d1/i,
    );
  });
});
