import { useQuery } from "@tanstack/react-query";

import { getStats } from "../api/dashboard";

export function useDashboardStats(enabled = true) {
  return useQuery({
    queryKey: ["dashboard", "stats"],
    queryFn: ({ signal }) => getStats(signal),
    enabled,
    staleTime: 30_000,
  });
}