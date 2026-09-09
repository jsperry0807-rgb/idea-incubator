import type { DashboardStats } from "@repo/shared";

import { client } from "@/axios";

export async function getStats(signal?: AbortSignal): Promise<DashboardStats> {
  const { data } = await client.get<{ data: DashboardStats }>("/dashboard/stats", {
    signal,
  });
  return data.data;
}