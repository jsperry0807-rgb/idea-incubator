import { z } from "zod";

import { IdeaPriority, IdeaStatus, IDEA_PRIORITY_VALUES, IDEA_STATUS_VALUES } from "../enums";

export const ideaTitleSchema = z.string().trim().min(1).max(200);

const statusEnum = z.enum(IDEA_STATUS_VALUES as [IdeaStatus, ...IdeaStatus[]]);
const priorityEnum = z.enum(
  IDEA_PRIORITY_VALUES as [IdeaPriority, ...IdeaPriority[]],
);

export const createIdeaSchema = z.object({
  title: ideaTitleSchema,
  description: z.string().trim().max(5000).optional().nullable(),
  status: statusEnum.optional(),
  priority: priorityEnum.optional(),
  tagIds: z.array(z.string().trim().min(1)).max(20).optional(),
});

export const updateIdeaSchema = z
  .object({
    title: ideaTitleSchema.optional(),
    description: z.string().trim().max(5000).optional().nullable(),
    status: statusEnum.optional(),
    priority: priorityEnum.optional(),
    tagIds: z.array(z.string().trim().min(1)).max(20).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided",
  });

export const ideaListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional(),
  pageSize: z.coerce.number().int().min(1).max(100).optional(),
  status: z.string().trim().max(200).optional(),
  priority: priorityEnum.optional(),
  search: z.string().trim().max(200).optional(),
  tagId: z.string().trim().min(1).optional(),
  sort: z.enum(["createdAt", "updatedAt", "title"]).optional(),
  order: z.enum(["asc", "desc"]).optional(),
});

export type CreateIdeaInput = z.infer<typeof createIdeaSchema>;
export type UpdateIdeaInput = z.infer<typeof updateIdeaSchema>;
export type IdeaListQuery = z.infer<typeof ideaListQuerySchema>;
