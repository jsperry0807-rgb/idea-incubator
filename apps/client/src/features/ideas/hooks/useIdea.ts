import { useQuery } from "@tanstack/react-query";

import { getIdea } from "../api/ideas";

export function useIdea(id: string) {
  return useQuery({
    queryKey: ["ideas", id],
    queryFn: () => getIdea(id),
    enabled: Boolean(id),
  });
}