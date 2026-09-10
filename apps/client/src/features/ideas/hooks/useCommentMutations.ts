import { useMutation, useQueryClient } from "@tanstack/react-query";
import type {
  CreateCommentInput,
  UpdateCommentInput,
} from "@repo/shared";

import {
  createComment,
  deleteComment,
  updateComment,
} from "../api/comments";

export function useCommentMutations(ideaId: string) {
  const queryClient = useQueryClient();
  const queryKey = ["ideas", ideaId, "comments"] as const;
  const invalidate = () => void queryClient.invalidateQueries({ queryKey });

  const create = useMutation({
    mutationFn: (input: CreateCommentInput) => createComment(ideaId, input),
    onSettled: invalidate,
  });

  const update = useMutation({
    mutationFn: ({ commentId, input }: { commentId: string; input: UpdateCommentInput }) =>
      updateComment(ideaId, commentId, input),
    onSettled: invalidate,
  });

  const remove = useMutation({
    mutationFn: (commentId: string) => deleteComment(ideaId, commentId),
    onSettled: invalidate,
  });

  return { create, update, remove };
}