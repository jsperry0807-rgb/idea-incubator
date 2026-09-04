import { useMutation, useQueryClient } from "@tanstack/react-query";

import { deleteTag } from "../api/tags";

export function useDeleteTag() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteTag,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["tags"] });
      void queryClient.invalidateQueries({ queryKey: ["ideas"] });
    },
  });
}