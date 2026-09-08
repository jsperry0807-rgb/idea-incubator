import type { PlanningSectionName } from "@repo/shared";

import { client } from "@/axios";

export interface PlanningSectionResult {
  section: PlanningSectionName;
  content: string;
  exists: boolean;
  created: boolean;
}

export async function getPlanningSection(
  ideaId: string,
  section: PlanningSectionName,
  signal?: AbortSignal,
): Promise<PlanningSectionResult> {
  const { data } = await client.get<{ data: PlanningSectionResult }>(
    `/ideas/${ideaId}/planning/${section}`,
    { signal },
  );
  return data.data;
}