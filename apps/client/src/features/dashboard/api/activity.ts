import type { ActivityItem } from "@repo/shared";

import { client } from "@/axios";

export async function getActivity(signal?: AbortSignal): Promise<ActivityItem[]> {
  const { data } = await client.get<{ data: ActivityItem[] }>("/dashboard/activity", {
    signal,
  });
  return data.data;
}