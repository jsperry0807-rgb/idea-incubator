import type { Tag } from "@repo/shared";

import { client } from "@/axios";

export async function getTags(): Promise<Tag[]> {
  const { data } = await client.get<{ data: Tag[] }>("/tags");
  return data.data;
}