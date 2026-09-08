import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { PlanningSectionName } from "@repo/shared";

import { updatePlanningSection } from "../api/planning";

export interface UpdatePlanningSectionVariables {
  ideaId: string;
  section: PlanningSectionName;
  content: string;
}

export function useUpdatePlanningSection() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ ideaId, section, content }: UpdatePlanningSectionVariables) =>
      updatePlanningSection(ideaId, section, content),
    onSuccess: (_data, { ideaId, section }) => {
      void queryClient.invalidateQueries({
        queryKey: ["ideas", ideaId, "planning", section],
      });
    },
  });
}