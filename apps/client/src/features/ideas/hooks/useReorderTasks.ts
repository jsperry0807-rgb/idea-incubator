import { useMutation, useQueryClient } from "@tanstack/react-query";

import { updateTask } from "../api/tasks";

export interface ReorderTaskPayload {
  taskId: string;
  sortOrder: number;
}

export function useReorderTasks(ideaId: string) {
  const queryClient = useQueryClient();
  const queryKey = ["ideas", ideaId, "tasks"] as const;

  return useMutation({
    mutationFn: (payloads: ReorderTaskPayload[]) =>
      Promise.all(
        payloads.map((payload) =>
          updateTask(ideaId, payload.taskId, { sortOrder: payload.sortOrder }),
        ),
      ),
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey });
    },
  });
}