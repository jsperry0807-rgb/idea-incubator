import type { CreateShareInput, Share, ShareRole } from "@repo/shared";

import { client } from "@/axios";

export async function getShares(
  ideaId: string,
  signal?: AbortSignal,
): Promise<Share[]> {
  const { data } = await client.get<{ data: Share[] }>(
    `/ideas/${ideaId}/shares`,
    { signal },
  );
  return data.data;
}

export async function createShare(
  ideaId: string,
  input: CreateShareInput,
): Promise<Share> {
  const { data } = await client.post<{ data: Share }>(
    `/ideas/${ideaId}/shares`,
    input,
  );
  return data.data;
}

export async function updateShareRole(
  ideaId: string,
  shareId: string,
  role: ShareRole,
): Promise<Share> {
  const { data } = await client.patch<{ data: Share }>(
    `/ideas/${ideaId}/shares/${shareId}`,
    { role },
  );
  return data.data;
}

export async function removeShare(
  ideaId: string,
  shareId: string,
): Promise<void> {
  await client.delete(`/ideas/${ideaId}/shares/${shareId}`);
}