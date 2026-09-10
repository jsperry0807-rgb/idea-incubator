import { useQuery } from "@tanstack/react-query";

import { getComments } from "../api/comments";

export function useComments(ideaId: string) {
  return useQuery({
    queryKey: ["ideas", ideaId, "comments"],
    queryFn: ({ signal }) => getComments(ideaId, signal),
    enabled: Boolean(ideaId),
    staleTime: 30_000,
  });
}