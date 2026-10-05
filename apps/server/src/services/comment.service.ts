import prisma from '../lib/prisma';
import { ForbiddenError, NotFoundError } from '../lib/errors';
import { assertIdeaAccess } from './idea.service';
import { createNotification } from './notification.service';
import type { Comment, CreateCommentInput, UpdateCommentInput } from '@repo/shared';

/** Page size for a comment thread. Threads are read, not browsed, so this is generous. */
const COMMENT_PAGE_SIZE = 100;

export async function listComments(userId: string, ideaId: string): Promise<Comment[]> {
  await assertIdeaAccess(userId, ideaId);

  const comments = await prisma.comment.findMany({
    where: { ideaId },
    include: {
      user: { select: { id: true, name: true, avatarUrl: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: COMMENT_PAGE_SIZE,
  });

  return comments.map(toCommentDto);
}

export async function createComment(
  userId: string,
  ideaId: string,
  input: CreateCommentInput
): Promise<Comment> {
  // The shared helper, rather than the hand-rolled copy this used to carry. The
  // copy had already drifted from it, so the two access paths could disagree.
  await assertIdeaAccess(userId, ideaId);

  const owner = await prisma.idea.findFirst({
    where: { id: ideaId },
    select: { id: true, userId: true, title: true },
  });

  if (!owner) {
    throw new NotFoundError('Idea not found');
  }

  const comment = await prisma.comment.create({
    data: {
      ideaId,
      userId,
      content: input.content,
    },
    include: {
      user: { select: { id: true, name: true, avatarUrl: true } },
    },
  });

  if (owner.userId !== userId) {
    const commenter = await prisma.user.findUnique({
      where: { id: userId },
      select: { name: true },
    });

    await createNotification({
      userId: owner.userId,
      type: 'COMMENT',
      message: `${commenter?.name} commented on "${owner.title}"`,
      ideaId: owner.id,
    });
  }

  return toCommentDto(comment);
}

export async function updateComment(
  userId: string,
  ideaId: string,
  commentId: string,
  input: UpdateCommentInput
): Promise<Comment> {
  await assertIdeaAccess(userId, ideaId);

  const existing = await prisma.comment.findFirst({
    where: { id: commentId, ideaId },
    select: { userId: true },
  });

  if (!existing) {
    throw new NotFoundError('Comment not found');
  }

  if (existing.userId !== userId) {
    throw new ForbiddenError('You can only edit your own comments');
  }

  const comment = await prisma.comment.update({
    where: { id: commentId },
    data: { content: input.content },
    include: {
      user: { select: { id: true, name: true, avatarUrl: true } },
    },
  });

  return toCommentDto(comment);
}

export async function deleteComment(
  userId: string,
  ideaId: string,
  commentId: string
): Promise<void> {
  const idea = await prisma.idea.findFirst({
    where: { id: ideaId },
    select: { userId: true },
  });

  if (!idea) {
    throw new NotFoundError('Idea not found');
  }

  const comment = await prisma.comment.findFirst({
    where: { id: commentId, ideaId },
    select: { userId: true },
  });

  if (!comment) {
    throw new NotFoundError('Comment not found');
  }

  if (comment.userId !== userId && idea.userId !== userId) {
    throw new ForbiddenError("You don't have permission to delete this comment");
  }

  await prisma.comment.delete({ where: { id: commentId } });
}

function toCommentDto(comment: {
  id: string;
  ideaId: string;
  userId: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
  user?: { id: string; name: string; avatarUrl: string | null } | null;
}): Comment {
  return {
    id: comment.id,
    ideaId: comment.ideaId,
    userId: comment.userId,
    content: comment.content,
    createdAt: comment.createdAt.toISOString(),
    updatedAt: comment.updatedAt.toISOString(),
    ...(comment.user
      ? {
          user: {
            id: comment.user.id,
            name: comment.user.name,
            avatarUrl: comment.user.avatarUrl,
          },
        }
      : {}),
  };
}
