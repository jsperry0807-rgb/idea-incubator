import { useQuery } from "@tanstack/react-query";
import type { PlanningSectionName } from "@repo/shared";

import { getPlanningSection } from "../api/planning";

export function usePlanningSection(
  ideaId: string,
  section: PlanningSectionName,
  enabled = true,
) {
  return useQuery({
    queryKey: ["ideas", ideaId, "planning", section],
    queryFn: ({ signal }) => getPlanningSection(ideaId, section, signal),
    enabled: enabled && Boolean(ideaId),
    staleTime: 30_000,
  });
}