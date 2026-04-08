import { z } from 'zod';

export const taskCardSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  note: z.string().min(1),
  completed: z.boolean(),
});

export const personColumnSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  ink: z.string().min(1),
  wash: z.string().min(1),
  completionRatio: z.number().min(0).max(1),
  tasks: z.array(taskCardSchema).min(1),
});

export const boardSnapshotSchema = z.object({
  dayLabel: z.string().min(1),
  householdName: z.string().min(1),
  columns: z.array(personColumnSchema).min(1),
});

export const boardResponseSchema = z.object({
  board: boardSnapshotSchema,
});

export type TaskCard = z.infer<typeof taskCardSchema>;
export type PersonColumn = z.infer<typeof personColumnSchema>;
export type BoardSnapshot = z.infer<typeof boardSnapshotSchema>;
export type BoardResponse = z.infer<typeof boardResponseSchema>;
