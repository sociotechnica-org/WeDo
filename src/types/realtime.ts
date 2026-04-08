import { z } from 'zod';
import { familyBoardStateSchema } from './entities';
import { identifierSchema, isoDateSchema } from './shared';

export type FamilyRoomKey = `family:${string}`;

export function getFamilyRoomKey(familyId: string): FamilyRoomKey {
  return `family:${familyId}`;
}

export const initRequestSchema = z
  .object({
    type: z.literal('init'),
    date: isoDateSchema,
  })
  .strict();

export const initResponseSchema = z
  .object({
    type: z.literal('init_response'),
    state: familyBoardStateSchema,
  })
  .strict();

export const taskToggledMessageSchema = z
  .object({
    type: z.literal('task_toggled'),
    date: isoDateSchema,
    task_id: identifierSchema,
    completed: z.boolean(),
  })
  .strict();

export const stateUpdateMessageSchema = z
  .object({
    type: z.literal('state_update'),
    state: familyBoardStateSchema,
  })
  .strict();

export const clientWebSocketMessageSchema = z.discriminatedUnion('type', [
  initRequestSchema,
  taskToggledMessageSchema,
]);

export const serverWebSocketMessageSchema = z.discriminatedUnion('type', [
  initResponseSchema,
  stateUpdateMessageSchema,
]);

export const webSocketMessageSchema = z.discriminatedUnion('type', [
  initRequestSchema,
  initResponseSchema,
  taskToggledMessageSchema,
  stateUpdateMessageSchema,
]);

export type InitRequest = z.infer<typeof initRequestSchema>;
export type InitResponse = z.infer<typeof initResponseSchema>;
export type TaskToggledMessage = z.infer<typeof taskToggledMessageSchema>;
export type StateUpdateMessage = z.infer<typeof stateUpdateMessageSchema>;
export type ClientWebSocketMessage = z.infer<
  typeof clientWebSocketMessageSchema
>;
export type ServerWebSocketMessage = z.infer<
  typeof serverWebSocketMessageSchema
>;
export type WebSocketMessage = z.infer<typeof webSocketMessageSchema>;
