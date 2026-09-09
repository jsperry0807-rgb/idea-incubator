import { useMutation, useQueryClient } from "@tanstack/react-query";

import { createTag } from "../api/tags";

export function useCreateTag() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createTag,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["tags"] });
    },
  });
}