import type { CreateTaskInput, Task, UpdateTaskInput } from "@repo/shared";

import { client } from "@/axios";

export async function getTasks(ideaId: string, signal?: AbortSignal): Promise<Task[]> {
  const { data } = await client.get<{ data: Task[] }>(`/ideas/${ideaId}/tasks`, {
    signal,
  });
  return data.data;
}

export async function createTask(
  ideaId: string,
  input: CreateTaskInput,
): Promise<Task> {
  const { data } = await client.post<{ data: Task }>(`/ideas/${ideaId}/tasks`, input);
  return data.data;
}

export async function updateTask(
  ideaId: string,
  taskId: string,
  input: UpdateTaskInput,
): Promise<Task> {
  const { data } = await client.patch<{ data: Task }>(
    `/ideas/${ideaId}/tasks/${taskId}`,
    input,
  );
  return data.data;
}