import prisma from "../lib/prisma";
import { ConflictError, NotFoundError } from "../lib/errors";
import { assertIdeaOwnership, toIdeaTags } from "./idea.service";
import type {
  CreateShareInput,
  SharedIdea,
  Share,
  UpdateShareInput,
} from "@repo/shared";

export async function getSharedWithMe(userId: string): Promise<SharedIdea[]> {
  const shares = await prisma.share.findMany({
    where: { userId },
    select: {
      role: true,
      idea: {
        include: {
          tags: { include: { tag: true } },
          user: {
            select: { id: true, name: true, avatarUrl: true },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return shares.map(({ role, idea }) => ({
    idea: {
      id: idea.id,
      title: idea.title,
      slug: idea.slug,
      description: idea.description,
      status: idea.status,
      priority: idea.priority,
      tags: toIdeaTags(idea.tags),
      updatedAt: idea.updatedAt.toISOString(),
    },
    sharedBy: {
      id: idea.user.id,
      name: idea.user.name,
      avatarUrl: idea.user.avatarUrl,
    },
    role,
  }));
}

export async function listShares(userId: string, ideaId: string): Promise<Share[]> {
  await assertIdeaOwnership(userId, ideaId);

  const shares = await prisma.share.findMany({
    where: { ideaId },
    include: {
      user: { select: { id: true, name: true, email: true, avatarUrl: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  return shares.map(toShareDto);
}

export async function createShare(
  userId: string,
  ideaId: string,
  input: CreateShareInput,
): Promise<Share> {
  await assertIdeaOwnership(userId, ideaId);

  const target = await prisma.user.findUnique({
    where: { email: input.email },
    select: { id: true, name: true, email: true, avatarUrl: true },
  });

  if (!target) {
    throw new NotFoundError("User with that email not found");
  }

  if (target.id === userId) {
    throw new ConflictError("Cannot share an idea with yourself");
  }

  const existing = await prisma.share.findUnique({
    where: { ideaId_userId: { ideaId, userId: target.id } },
    select: { id: true },
  });

  if (existing) {
    throw new ConflictError("User already has access to this idea");
  }

  const share = await prisma.share.create({
    data: {
      ideaId,
      userId: target.id,
      role: input.role,
    },
    include: {
      user: { select: { id: true, name: true, email: true, avatarUrl: true } },
    },
  });

  return toShareDto(share);
}

export async function updateShareRole(
  userId: string,
  ideaId: string,
  shareId: string,
  input: UpdateShareInput,
): Promise<Share> {
  await assertIdeaOwnership(userId, ideaId);

  const existing = await prisma.share.findFirst({
    where: { id: shareId, ideaId },
    select: { id: true },
  });

  if (!existing) {
    throw new NotFoundError("Share not found");
  }

  const share = await prisma.share.update({
    where: { id: shareId },
    data: { role: input.role },
    include: {
      user: { select: { id: true, name: true, email: true, avatarUrl: true } },
    },
  });

  return toShareDto(share);
}

export async function removeShare(
  userId: string,
  ideaId: string,
  shareId: string,
): Promise<void> {
  await assertIdeaOwnership(userId, ideaId);

  const existing = await prisma.share.findFirst({
    where: { id: shareId, ideaId },
    select: { id: true },
  });

  if (!existing) {
    throw new NotFoundError("Share not found");
  }

  await prisma.share.delete({ where: { id: shareId } });
}

function toShareDto(share: {
  id: string;
  ideaId: string;
  userId: string;
  role: Share["role"];
  createdAt: Date;
  user?: { id: string; name: string; email: string; avatarUrl: string | null } | null;
}): Share {
  return {
    id: share.id,
    ideaId: share.ideaId,
    userId: share.userId,
    role: share.role,
    createdAt: share.createdAt.toISOString(),
    ...(share.user
      ? {
          user: {
            id: share.user.id,
            name: share.user.name,
            email: share.user.email,
            avatarUrl: share.user.avatarUrl,
          },
        }
      : {}),
  };
}