import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { UpdateIdeaInput } from "@repo/shared";

import { updateIdea } from "../api/ideas";

export interface UpdateIdeaArgs {
  id: string;
  input: UpdateIdeaInput;
}

export function useUpdateIdea() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }: UpdateIdeaArgs) => updateIdea(id, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["ideas"] });
    },
  });
}
