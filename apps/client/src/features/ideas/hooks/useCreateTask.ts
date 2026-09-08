import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { CreateTaskInput } from "@repo/shared";

import { createTask } from "../api/tasks";

export function useCreateTask(ideaId: string) {
  const queryClient = useQueryClient();
  const queryKey = ["ideas", ideaId, "tasks"] as const;

  return useMutation({
    mutationFn: (input: CreateTaskInput) => createTask(ideaId, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey });
    },
  });
}