import { z } from 'zod';

import { TASK_STATUS_VALUES, type TaskStatus } from '../enums';
import { cidSchema } from './common';

const taskTitleSchema = z.string().trim().min(1, 'Task title is required').max(200);

const milestoneSchema = z.string().trim().max(100);

const taskStatusSchema = z.enum(TASK_STATUS_VALUES as [TaskStatus, ...TaskStatus[]]);

export const createTaskSchema = z.object({
  title: taskTitleSchema,
  milestone: milestoneSchema.optional(),
  status: taskStatusSchema.optional(),
  sortOrder: z.number().int().min(0).optional(),
});

export const updateTaskSchema = z
  .object({
    title: taskTitleSchema.optional(),
    completed: z.boolean().optional(),
    status: taskStatusSchema.optional(),
    milestone: milestoneSchema.nullable().optional(),
    sortOrder: z.number().int().min(0).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided',
  })
  .refine(
    (data) =>
      !(data.completed !== undefined && data.status !== undefined) ||
      data.completed === (data.status === 'DONE'),
    {
      message: 'completed must agree with status',
      path: ['completed'],
    }
  );

export const taskIdParamsSchema = z.object({
  taskId: cidSchema,
});

export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
