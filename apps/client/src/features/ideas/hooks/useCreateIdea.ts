import { useMutation, useQueryClient } from "@tanstack/react-query";

import { createIdea } from "../api/ideas";

export function useCreateIdea() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createIdea,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["ideas"] });
    },
  });
}