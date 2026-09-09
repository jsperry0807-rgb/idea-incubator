import { useQuery } from "@tanstack/react-query";

import { getIdeas } from "../api/ideas";
import type { IdeaFilters } from "../types";

export function useIdeas(filters: IdeaFilters) {
  return useQuery({
    queryKey: ["ideas", filters],
    queryFn: ({ signal }) => getIdeas(filters, signal),
    placeholderData: (prev) => prev,
  });
}