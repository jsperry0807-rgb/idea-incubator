import { useQuery } from "@tanstack/react-query";

import { getTasks } from "../api/tasks";

export function useTasks(ideaId: string, enabled = true) {
  return useQuery({
    queryKey: ["ideas", ideaId, "tasks"],
    queryFn: ({ signal }) => getTasks(ideaId, signal),
    enabled: enabled && Boolean(ideaId),
    staleTime: 30_000,
  });
}