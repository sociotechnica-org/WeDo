import { z } from 'zod';
import { familyBoardStateSchema } from './entities';
import {
  identifierSchema,
  isoDateSchema,
  nonEmptyStringSchema,
} from './shared';

export const personSettingsEntrySchema = z
  .object({
    id: identifierSchema.optional(),
    name: nonEmptyStringSchema,
    emoji: nonEmptyStringSchema,
  })
  .strict();

export function normalizePersonName(value: string): string {
  return value.toLocaleLowerCase();
}

export const savePersonsRequestSchema = z
  .object({
    viewed_date: isoDateSchema,
    people: z.array(personSettingsEntrySchema).min(1),
  })
  .strict()
  .superRefine((value, context) => {
    const seenNames = new Set<string>();
    const seenIds = new Set<string>();

    value.people.forEach((person, index) => {
      const normalizedName = normalizePersonName(person.name);

      if (seenNames.has(normalizedName)) {
        context.addIssue({
          code: 'custom',
          message: 'Each Person name must be unique.',
          path: ['people', index, 'name'],
        });
      } else {
        seenNames.add(normalizedName);
      }

      if (!person.id) {
        return;
      }

      if (seenIds.has(person.id)) {
        context.addIssue({
          code: 'custom',
          message: 'Each Person may appear only once in a save request.',
          path: ['people', index, 'id'],
        });
        return;
      }

      seenIds.add(person.id);
    });
  });

export const savePersonsResponseSchema = z
  .object({
    state: familyBoardStateSchema,
  })
  .strict();

export type PersonSettingsEntry = z.infer<typeof personSettingsEntrySchema>;
export type SavePersonsRequest = z.infer<typeof savePersonsRequestSchema>;
export type SavePersonsResponse = z.infer<typeof savePersonsResponseSchema>;
