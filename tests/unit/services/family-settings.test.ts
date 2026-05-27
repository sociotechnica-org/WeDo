import { beforeEach, describe, expect, it, vi } from 'vitest';

const repositoryMocks = vi.hoisted(() => ({
  getFamilySettings: vi.fn(),
  upsertFamilySettings: vi.fn(),
}));

vi.mock('@/db/family-settings-repository', () => ({
  getFamilySettings: repositoryMocks.getFamilySettings,
  upsertFamilySettings: repositoryMocks.upsertFamilySettings,
}));

import {
  getSavedFamilyTimezone,
  saveFamilySettings,
} from '@/services/family-settings';

describe('family-settings service', () => {
  beforeEach(() => {
    repositoryMocks.getFamilySettings.mockReset();
    repositoryMocks.upsertFamilySettings.mockReset();
  });

  it('returns the saved timezone when a family settings row exists', async () => {
    repositoryMocks.getFamilySettings.mockResolvedValue({
      family_id: 'family-maple',
      timezone: 'America/Los_Angeles',
      updated_at: '2026-04-08T12:00:00Z',
    });

    await expect(
      getSavedFamilyTimezone({} as never, 'family-maple'),
    ).resolves.toBe('America/Los_Angeles');
  });

  it('persists a validated family timezone setting', async () => {
    repositoryMocks.upsertFamilySettings.mockImplementation(
      async (_client, settings) => settings,
    );

    const settings = await saveFamilySettings({} as never, {
      familyId: 'family-maple',
      timezone: 'America/Chicago',
    });

    expect(settings).toEqual({
      family_id: 'family-maple',
      timezone: 'America/Chicago',
      updated_at: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T/),
    });
    expect(repositoryMocks.upsertFamilySettings).toHaveBeenCalledWith(
      {},
      settings,
    );
  });
});
