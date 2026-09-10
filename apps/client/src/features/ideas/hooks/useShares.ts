import { useQuery } from "@tanstack/react-query";

import { getShares } from "../api/shares";

export function useShares(ideaId: string, enabled = true) {
  return useQuery({
    queryKey: ["ideas", ideaId, "shares"],
    queryFn: ({ signal }) => getShares(ideaId, signal),
    enabled: enabled && Boolean(ideaId),
    staleTime: 30_000,
  });
}