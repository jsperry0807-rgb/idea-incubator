import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { CreateShareInput, ShareRole } from "@repo/shared";

import {
  createShare,
  removeShare,
  updateShareRole,
} from "../api/shares";

export function useShareMutations(ideaId: string) {
  const queryClient = useQueryClient();
  const queryKey = ["ideas", ideaId, "shares"] as const;
  const invalidate = () => void queryClient.invalidateQueries({ queryKey });

  const invite = useMutation({
    mutationFn: (input: CreateShareInput) => createShare(ideaId, input),
    onSettled: invalidate,
  });

  const changeRole = useMutation({
    mutationFn: ({ shareId, role }: { shareId: string; role: ShareRole }) =>
      updateShareRole(ideaId, shareId, role),
    onSettled: invalidate,
  });

  const remove = useMutation({
    mutationFn: (shareId: string) => removeShare(ideaId, shareId),
    onSettled: invalidate,
  });

  return { invite, changeRole, remove };
}