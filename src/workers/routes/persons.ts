import type { Hono } from 'hono';
import { ZodError } from 'zod';
import {
  PersonSettingsError,
  saveFamilyPersons,
} from '@/services/person-settings';
import { savePersonsRequestSchema, savePersonsResponseSchema } from '@/types';
import { type WorkerBindings } from '@/config/runtime';

type AppEnv = {
  Bindings: WorkerBindings;
};

const unexpectedPersonSaveMessage =
  'Person settings are temporarily unavailable.';

export function registerPersonRoutes(app: Hono<AppEnv>) {
  app.put('/api/families/:familyId/persons', async (context) => {
    try {
      const familyId = context.req.param('familyId');
      const requestBody = savePersonsRequestSchema.parse(
        (await context.req.json()) as unknown,
      );
      const state = await saveFamilyPersons(context.env.DB, {
        familyId,
        viewedDate: requestBody.viewed_date,
        people: requestBody.people,
      });

      return context.json(
        savePersonsResponseSchema.parse({
          state,
        }),
      );
    } catch (error) {
      if (error instanceof ZodError) {
        return context.text('Person settings request is invalid.', 400);
      }

      if (error instanceof PersonSettingsError) {
        return context.text(error.message, 400);
      }

      if (error instanceof Error) {
        return context.text(unexpectedPersonSaveMessage, 503);
      }

      return context.text('Saving person settings failed.', 500);
    }
  });
}
