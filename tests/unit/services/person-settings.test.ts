import { beforeEach, describe, expect, it, vi } from 'vitest';

const repositoryMocks = vi.hoisted(() => ({
  applySaveFamilyPersonsPlan: vi.fn(),
  getFamilyPersons: vi.fn(),
}));

const familyBoardServiceMocks = vi.hoisted(() => ({
  getFamilyBoardState: vi.fn(),
}));

vi.mock('@/db/person-settings-repository', () => ({
  applySaveFamilyPersonsPlan: repositoryMocks.applySaveFamilyPersonsPlan,
  getFamilyPersons: repositoryMocks.getFamilyPersons,
}));

vi.mock('@/services/family-board-service', () => ({
  getFamilyBoardState: familyBoardServiceMocks.getFamilyBoardState,
}));

import {
  buildSaveFamilyPersonsPlan,
  PersonSettingsError,
  saveFamilyPersons,
} from '@/services/person-settings';

const existingPeople = [
  {
    id: 'person-jess',
    family_id: 'family-maple',
    name: 'Jess',
    display_order: 0,
    emoji: '🌿',
  },
  {
    id: 'person-elizabeth',
    family_id: 'family-maple',
    name: 'Elizabeth',
    display_order: 1,
    emoji: '🪴',
  },
] as const;

describe('person-settings service', () => {
  beforeEach(() => {
    repositoryMocks.applySaveFamilyPersonsPlan.mockReset();
    repositoryMocks.getFamilyPersons.mockReset();
    familyBoardServiceMocks.getFamilyBoardState.mockReset();
  });

  it('builds a save plan that preserves existing ids, assigns new ids, and tracks removals', () => {
    const plan = buildSaveFamilyPersonsPlan(
      'family-maple',
      [...existingPeople],
      [
        {
          id: 'person-elizabeth',
          name: 'Elizabeth',
          emoji: '🌻',
        },
        {
          name: 'Cora',
          emoji: '🫧',
        },
      ],
      {
        createId: () => 'person-cora',
      },
    );

    expect(plan.removedPersonIds).toEqual(['person-jess']);
    expect(plan.existingUpdates).toEqual([
      expect.objectContaining({
        id: 'person-elizabeth',
        name: 'Elizabeth',
        emoji: '🌻',
        displayOrder: 0,
      }),
    ]);
    expect(plan.newPeople).toEqual([
      {
        id: 'person-cora',
        family_id: 'family-maple',
        name: 'Cora',
        display_order: 1,
        emoji: '🫧',
      },
    ]);
    expect(plan.existingUpdates[0]?.temporaryName).toContain(
      'person-elizabeth',
    );
    expect(plan.existingUpdates[0]?.temporaryDisplayOrder).toBeGreaterThan(1);
  });

  it('rejects submitted ids that are outside the family scope', () => {
    expect(() =>
      buildSaveFamilyPersonsPlan('family-maple', [...existingPeople], [
        {
          id: 'person-outside-family',
          name: 'Stranger',
          emoji: '👀',
        },
      ]),
    ).toThrow(PersonSettingsError);
  });

  it('rejects duplicate Person names even when the caller bypasses request-schema validation', () => {
    expect(() =>
      buildSaveFamilyPersonsPlan('family-maple', [...existingPeople], [
        {
          id: 'person-jess',
          name: 'Jess',
          emoji: '🌿',
        },
        {
          id: 'person-elizabeth',
          name: ' jess ',
          emoji: '🪴',
        },
      ]),
    ).toThrowError(new PersonSettingsError('Each Person name must be unique.'));
  });

  it('persists the reconciled person list and returns a refreshed board snapshot', async () => {
    repositoryMocks.getFamilyPersons.mockResolvedValue([...existingPeople]);
    familyBoardServiceMocks.getFamilyBoardState.mockResolvedValue({
      family_id: 'family-maple',
      day: {
        date: '2026-04-08',
        is_sunday: false,
      },
      people: [],
    });

    await saveFamilyPersons({} as never, {
      familyId: 'family-maple',
      viewedDate: '2026-04-08',
      people: [
        {
          id: 'person-elizabeth',
          name: 'Elizabeth',
          emoji: '🪴',
        },
        {
          id: 'person-jess',
          name: 'Jess',
          emoji: '🌿',
        },
      ],
    });

    expect(repositoryMocks.getFamilyPersons).toHaveBeenCalledWith(
      {},
      'family-maple',
    );
    expect(repositoryMocks.applySaveFamilyPersonsPlan).toHaveBeenCalledWith(
      {},
      'family-maple',
      expect.objectContaining({
        removedPersonIds: [],
        existingUpdates: [
          expect.objectContaining({
            id: 'person-elizabeth',
            displayOrder: 0,
          }),
          expect.objectContaining({
            id: 'person-jess',
            displayOrder: 1,
          }),
        ],
      }),
    );
    expect(familyBoardServiceMocks.getFamilyBoardState).toHaveBeenCalledWith(
      {},
      'family-maple',
      '2026-04-08',
    );
  });
});
