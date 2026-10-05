import { z } from 'zod';
import { cidSchema } from './common';

// `z.coerce.boolean()` applies Boolean(), and Boolean("false") is true — so
// `?unread=false` filtered to unread only, the exact opposite of what was asked.
export const notificationListQuerySchema = z.object({
  unread: z.stringbool().optional(),
  page: z.coerce.number().int().min(1).optional(),
  pageSize: z.coerce.number().int().min(1).max(100).optional(),
});

export const notificationIdParamsSchema = z.object({
  id: cidSchema,
});

export type NotificationListQuery = z.infer<typeof notificationListQuerySchema>;
