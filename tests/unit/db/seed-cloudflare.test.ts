import { describe, expect, it } from 'vitest';
import {
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
