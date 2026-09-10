import { z } from "zod";
import { cidSchema } from "./common";

const commentContentSchema = z.string().trim().min(1, "Comment cannot be empty").max(5000);

export const createCommentSchema = z.object({
  content: commentContentSchema,
});

export const updateCommentSchema = z.object({
  content: commentContentSchema,
});

export const commentIdParamsSchema = z.object({
  commentId: cidSchema,
});

export type CreateCommentInput = z.infer<typeof createCommentSchema>;
export type UpdateCommentInput = z.infer<typeof updateCommentSchema>;