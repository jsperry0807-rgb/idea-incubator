import type { Task } from "@repo/shared";

import { client } from "@/axios";

export async function getTasks(ideaId: string, signal?: AbortSignal): Promise<Task[]> {
  const { data } = await client.get<{ data: Task[] }>(`/ideas/${ideaId}/tasks`, {
    signal,
  });
  return data.data;
}