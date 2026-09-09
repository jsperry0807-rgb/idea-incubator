import type { Idea, IdeaPipeline, IdeaStatus } from "@repo/shared";

import { client } from "@/axios";

export async function getPipeline(signal?: AbortSignal): Promise<IdeaPipeline> {
  const { data } = await client.get<{ data: IdeaPipeline }>("/ideas/pipeline", {
    signal,
  });
  return data.data;
}

export async function updateIdeaStatus(
  ideaId: string,
  status: IdeaStatus,
): Promise<Idea> {
  const { data } = await client.patch<{ data: Idea }>(
    `/ideas/${ideaId}/status`,
    { status },
  );
  return data.data;
}