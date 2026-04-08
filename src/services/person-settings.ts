import {
  applySaveFamilyPersonsPlan,
  getFamilyPersons,
  type ExistingPersonUpdate,
  type NewPersonInsert,
  type SaveFamilyPersonsPlan,
} from '@/db/person-settings-repository';
import { type DatabaseClient } from '@/db/database';
import { getFamilyBoardState } from '@/services/family-board-service';
import {
  normalizePersonName,
  personSchema,
  personSettingsEntrySchema,
  type FamilyBoardState,
  type IsoDate,
  type Person,
  type PersonSettingsEntry,
} from '@/types';

type SaveFamilyPersonsInput = {
  familyId: string;
  viewedDate: IsoDate;
  people: PersonSettingsEntry[];
};

type BuildSaveFamilyPersonsPlanOptions = {
  createId?: () => string;
};

const temporaryPersonNamePrefix = '__wedo_person_tmp__';

export class PersonSettingsError extends Error {}

export function buildSaveFamilyPersonsPlan(
  familyId: string,
  existingPeople: Person[],
  submittedPeople: PersonSettingsEntry[],
  options: BuildSaveFamilyPersonsPlanOptions = {},
): SaveFamilyPersonsPlan {
  const createId = options.createId ?? (() => crypto.randomUUID());

  if (existingPeople.length === 0) {
    throw new PersonSettingsError(
      `Family ${familyId} has no existing people to manage.`,
    );
  }

  if (submittedPeople.length === 0) {
    throw new PersonSettingsError('At least one Person must remain on the board.');
  }

  const normalizedSubmittedPeople = submittedPeople.map((person) =>
    personSettingsEntrySchema.parse(person),
  );
  const existingPeopleById = new Map(
    existingPeople.map((person) => [person.id, person] as const),
  );
  const keptExistingIds = new Set<string>();
  const seenNames = new Set<string>();
  const existingUpdates: ExistingPersonUpdate[] = [];
  const newPeople: NewPersonInsert[] = [];
  const temporaryDisplayOrderBase =
    Math.max(existingPeople.length, normalizedSubmittedPeople.length) + 32;

  normalizedSubmittedPeople.forEach((person, index) => {
    const normalizedName = normalizePersonName(person.name);

    if (seenNames.has(normalizedName)) {
      throw new PersonSettingsError('Each Person name must be unique.');
    }

    seenNames.add(normalizedName);

    if (person.id) {
      const existingPerson = existingPeopleById.get(person.id);

      if (!existingPerson) {
        throw new PersonSettingsError(
          `Person ${person.id} does not belong to family ${familyId}.`,
        );
      }

      if (keptExistingIds.has(person.id)) {
        throw new PersonSettingsError(
          `Person ${person.id} appears more than once in the save request.`,
        );
      }

      keptExistingIds.add(person.id);
      existingUpdates.push({
        id: existingPerson.id,
        temporaryName: `${temporaryPersonNamePrefix}${existingPerson.id}`,
        temporaryDisplayOrder: temporaryDisplayOrderBase + index,
        name: person.name,
        emoji: person.emoji,
        displayOrder: index,
      });
      return;
    }

    newPeople.push(
      personSchema.parse({
        id: createId(),
        family_id: familyId,
        name: person.name,
        display_order: index,
        emoji: person.emoji,
      }),
    );
  });

  return {
    removedPersonIds: existingPeople
      .filter((person) => !keptExistingIds.has(person.id))
      .map((person) => person.id),
    existingUpdates,
    newPeople,
  };
}

export async function saveFamilyPersons(
  client: DatabaseClient,
  input: SaveFamilyPersonsInput,
): Promise<FamilyBoardState> {
  const existingPeople = await getFamilyPersons(client, input.familyId);
  const plan = buildSaveFamilyPersonsPlan(
    input.familyId,
    existingPeople,
    input.people,
  );

  await applySaveFamilyPersonsPlan(client, input.familyId, plan);

  return await getFamilyBoardState(client, input.familyId, input.viewedDate);
}
