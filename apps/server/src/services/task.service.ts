import prisma from '../lib/prisma';
import { NotFoundError } from '../lib/errors';
import type { CreateTaskInput, Task, TaskStatus, UpdateTaskInput } from '@repo/shared';
import { assertIdeaOwnership } from './idea.service';

export async function listTasks(userId: string, ideaId: string): Promise<Task[]> {
  await assertIdeaOwnership(userId, ideaId);

  const tasks = await prisma.task.findMany({
    where: { ideaId },
    orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
  });

  return tasks.map(toTaskDto);
}

export async function createTask(
  userId: string,
  ideaId: string,
  input: CreateTaskInput
): Promise<Task> {
  await assertIdeaOwnership(userId, ideaId);

  let sortOrder = input.sortOrder;
  if (sortOrder === undefined) {
    const last = await prisma.task.findFirst({
      where: { ideaId },
      orderBy: { sortOrder: 'desc' },
      select: { sortOrder: true },
    });
    sortOrder = (last?.sortOrder ?? -1) + 1;
  }

  const task = await prisma.task.create({
    data: {
      ideaId,
      title: input.title,
      milestone: input.milestone ?? null,
      status: input.status ?? 'TODO',
      completed: input.status === 'DONE',
      sortOrder,
    },
  });

  return toTaskDto(task);
}

export async function updateTask(
  userId: string,
  ideaId: string,
  taskId: string,
  input: UpdateTaskInput
): Promise<Task> {
  await assertIdeaOwnership(userId, ideaId);

  const existing = await prisma.task.findFirst({
    where: { id: taskId, ideaId },
    select: { id: true },
  });

  if (!existing) {
    throw new NotFoundError('Task not found');
  }

  const task = await prisma.task.update({
    where: { id: taskId },
    data: {
      ...(input.title !== undefined ? { title: input.title } : {}),
      ...(input.milestone !== undefined ? { milestone: input.milestone } : {}),
      ...(input.sortOrder !== undefined ? { sortOrder: input.sortOrder } : {}),
      // `status` is the source of truth; `completed` is kept in sync because
      // dashboard stats and idea summaries still read it directly.
      ...(input.status !== undefined
        ? { status: input.status, completed: input.status === 'DONE' }
        : input.completed !== undefined
          ? {
              status: input.completed ? ('DONE' as const) : ('TODO' as const),
              completed: input.completed,
            }
          : {}),
    },
  });

  return toTaskDto(task);
}

export async function deleteTask(userId: string, ideaId: string, taskId: string): Promise<void> {
  await assertIdeaOwnership(userId, ideaId);

  const existing = await prisma.task.findFirst({
    where: { id: taskId, ideaId },
    select: { id: true },
  });

  if (!existing) {
    throw new NotFoundError('Task not found');
  }

  await prisma.task.delete({ where: { id: taskId } });
}

function toTaskDto(task: {
  id: string;
  ideaId: string;
  title: string;
  completed: boolean;
  status: TaskStatus;
  milestone: string | null;
  sortOrder: number;
  createdAt: Date;
}): Task {
  return {
    id: task.id,
    ideaId: task.ideaId,
    title: task.title,
    completed: task.completed,
    status: task.status,
    milestone: task.milestone,
    sortOrder: task.sortOrder,
    createdAt: task.createdAt.toISOString(),
  };
}
