import { z } from "zod";
import { cidSchema } from "./common";

export const notificationListQuerySchema = z.object({
  unread: z.coerce.boolean().optional(),
});

export const notificationIdParamsSchema = z.object({
  id: cidSchema,
});

export type NotificationListQuery = z.infer<typeof notificationListQuerySchema>;