import type { Hono } from 'hono';
import { ZodError } from 'zod';
import {
  FamilySettingsError,
  saveFamilySettings,
} from '@/services/family-settings';
import {
  saveFamilySettingsRequestSchema,
  saveFamilySettingsResponseSchema,
  type SaveFamilySettingsRequest,
} from '@/types';
import { type WorkerBindings } from '@/config/runtime';

type AppEnv = {
  Bindings: WorkerBindings;
};

const unexpectedFamilySettingsMessage =
  'Family settings are temporarily unavailable.';

export function registerSettingsRoutes(app: Hono<AppEnv>) {
  app.put('/api/families/:familyId/settings', async (context) => {
    let requestBody: SaveFamilySettingsRequest;

    try {
      requestBody = saveFamilySettingsRequestSchema.parse(
        (await context.req.json()) as unknown,
      );
    } catch (error) {
      if (error instanceof ZodError) {
        return context.text('Family settings request is invalid.', 400);
      }
      if (error instanceof Error) {
        return context.text(unexpectedFamilySettingsMessage, 503);
      }
      return context.text('Saving family settings failed.', 500);
    }

    try {
      const familyId = context.req.param('familyId');
      const settings = await saveFamilySettings(context.env.DB, {
        familyId,
        timezone: requestBody.timezone,
      });

      return context.json(
        saveFamilySettingsResponseSchema.parse({
          settings,
        }),
      );
    } catch (error) {
      if (error instanceof FamilySettingsError || error instanceof ZodError) {
        return context.text('Family settings request is invalid.', 400);
      }

      if (error instanceof Error) {
        return context.text(unexpectedFamilySettingsMessage, 503);
      }

      return context.text('Saving family settings failed.', 500);
    }
  });
}
