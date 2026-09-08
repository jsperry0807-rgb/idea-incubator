import type { IdeaPipeline } from "@repo/shared";

import { client } from "@/axios";

export async function getPipeline(signal?: AbortSignal): Promise<IdeaPipeline> {
  const { data } = await client.get<{ data: IdeaPipeline }>("/ideas/pipeline", {
    signal,
  });
  return data.data;
}