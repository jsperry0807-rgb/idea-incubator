import { useMutation, useQueryClient } from "@tanstack/react-query";

import { updateTag } from "../api/tags";

export function useUpdateTag() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Parameters<typeof updateTag>[1] }) =>
      updateTag(id, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["tags"] });
      void queryClient.invalidateQueries({ queryKey: ["ideas"] });
    },
  });
}