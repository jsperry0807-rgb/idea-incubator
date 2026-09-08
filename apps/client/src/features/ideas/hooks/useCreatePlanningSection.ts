import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { PlanningSectionName } from "@repo/shared";

import { createPlanningSection } from "../api/planning";

export interface CreatePlanningSectionVariables {
  ideaId: string;
  section: PlanningSectionName;
}

export function useCreatePlanningSection() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ ideaId, section }: CreatePlanningSectionVariables) =>
      createPlanningSection(ideaId, section),
    onSuccess: (_data, { ideaId, section }) => {
      void queryClient.invalidateQueries({
        queryKey: ["ideas", ideaId, "planning", section],
      });
    },
  });
}