import type { PlanningSectionName } from "@repo/shared";

import { client } from "@/axios";

export interface PlanningSectionResult {
  section: PlanningSectionName;
  content: string;
  exists: boolean;
  created: boolean;
}

export interface PlanningSectionUpdateResult {
  section: PlanningSectionName;
  updatedAt: string;
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

export async function updatePlanningSection(
  ideaId: string,
  section: PlanningSectionName,
  content: string,
): Promise<PlanningSectionUpdateResult> {
  const { data } = await client.put<{ data: PlanningSectionUpdateResult }>(
    `/ideas/${ideaId}/planning/${section}`,
    { content },
  );
  return data.data;
}