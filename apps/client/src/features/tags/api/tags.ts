import type { CreateTagInput, Tag, UpdateTagInput } from "@repo/shared";

import { client } from "@/axios";

export async function getTags(): Promise<Tag[]> {
  const { data } = await client.get<{ data: Tag[] }>("/tags");
  return data.data;
}

export async function createTag(input: CreateTagInput): Promise<Tag> {
  const { data } = await client.post<{ data: Tag }>("/tags", input);
  return data.data;
}

export async function updateTag(id: string, input: UpdateTagInput): Promise<Tag> {
  const { data } = await client.patch<{ data: Tag }>(`/tags/${id}`, input);
  return data.data;
}

export async function deleteTag(id: string): Promise<void> {
  await client.delete(`/tags/${id}`);
}