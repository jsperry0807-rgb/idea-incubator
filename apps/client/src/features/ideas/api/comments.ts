import type {
  Comment,
  CreateCommentInput,
  UpdateCommentInput,
} from "@repo/shared";

import { client } from "@/axios";

export async function getComments(
  ideaId: string,
  signal?: AbortSignal,
): Promise<Comment[]> {
  const { data } = await client.get<{ data: Comment[] }>(
    `/ideas/${ideaId}/comments`,
    { signal },
  );
  return data.data;
}

export async function createComment(
  ideaId: string,
  input: CreateCommentInput,
): Promise<Comment> {
  const { data } = await client.post<{ data: Comment }>(
    `/ideas/${ideaId}/comments`,
    input,
  );
  return data.data;
}

export async function updateComment(
  ideaId: string,
  commentId: string,
  input: UpdateCommentInput,
): Promise<Comment> {
  const { data } = await client.patch<{ data: Comment }>(
    `/ideas/${ideaId}/comments/${commentId}`,
    input,
  );
  return data.data;
}

export async function deleteComment(
  ideaId: string,
  commentId: string,
): Promise<void> {
  await client.delete(`/ideas/${ideaId}/comments/${commentId}`);
}