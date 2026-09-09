import { useQuery } from "@tanstack/react-query";

import { getActivity } from "../api/activity";

export function useActivity(enabled = true) {
  return useQuery({
    queryKey: ["dashboard", "activity"],
    queryFn: ({ signal }) => getActivity(signal),
    enabled,
    staleTime: 30_000,
  });
}