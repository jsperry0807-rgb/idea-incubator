import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { Task, UpdateTaskInput } from "@repo/shared";

import { updateTask } from "../api/tasks";

export interface UpdateTaskVariables {
  taskId: string;
  input: UpdateTaskInput;
}

export function useUpdateTask(ideaId: string) {
  const queryClient = useQueryClient();
  const queryKey = ["ideas", ideaId, "tasks"] as const;

  return useMutation({
    mutationFn: ({ taskId, input }: UpdateTaskVariables) =>
      updateTask(ideaId, taskId, input),
    onMutate: async ({ taskId, input }) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<Task[]>(queryKey);

      queryClient.setQueryData<Task[]>(queryKey, (tasks) =>
        tasks?.map((task) => (task.id === taskId ? { ...task, ...input } : task)),
      );

      return { previous };
    },
    onError: (_error, _variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKey, context.previous);
      }
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey });
    },
  });
}