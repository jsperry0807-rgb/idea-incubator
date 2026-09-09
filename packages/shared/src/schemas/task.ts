import { z } from "zod";
import { cidSchema } from "./common";

const taskTitleSchema = z.string().trim().min(1, "Task title is required").max(200);

const milestoneSchema = z.string().trim().max(100);

export const createTaskSchema = z.object({
  title: taskTitleSchema,
  milestone: milestoneSchema.optional(),
  sortOrder: z.number().int().min(0).optional(),
});

export const updateTaskSchema = z
  .object({
    title: taskTitleSchema.optional(),
    completed: z.boolean().optional(),
    milestone: milestoneSchema.nullable().optional(),
    sortOrder: z.number().int().min(0).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided",
  });

export const taskIdParamsSchema = z.object({
  taskId: cidSchema,
});

export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;