import prisma from '../lib/prisma';
import { ConflictError, NotFoundError } from '../lib/errors';
import { withPrismaErrors } from '../lib/prismaErrors';
import type { CreateTagInput, Tag, UpdateTagInput } from '@repo/shared';

export async function listTags(userId: string): Promise<Tag[]> {
  const tags = await prisma.tag.findMany({
    where: { userId },
    orderBy: { name: 'asc' },
  });

  return tags.map(toTagDto);
}

export async function createTag(userId: string, input: CreateTagInput): Promise<Tag> {
  // No pre-check: two requests can both pass one and only the unique index can
  // decide. The race loser arrives as P2002, which is translated to a 409.
  const tag = await withPrismaErrors(() =>
    prisma.tag.create({
      data: {
        userId,
        name: input.name,
        color: input.color ?? null,
      },
    })
  ).catch((err: unknown) => {
    if (err instanceof ConflictError) {
      throw new ConflictError(`Tag "${input.name}" already exists`);
    }
    throw err;
  });

  return toTagDto(tag);
}

export async function updateTag(userId: string, id: string, input: UpdateTagInput): Promise<Tag> {
  const existing = await prisma.tag.findFirst({
    where: { id, userId },
    select: { id: true, name: true },
  });

  if (!existing) {
    throw new NotFoundError('Tag not found');
  }

  // The collision pre-check is gone; the unique index decides, and P2002 becomes
  // a 409 rather than a 500 when two renames to the same name race.
  const tag = await withPrismaErrors(() =>
    prisma.tag.update({
      where: { id },
      data: {
        ...(input.name !== undefined ? { name: input.name } : {}),
        ...(input.color !== undefined ? { color: input.color ?? null } : {}),
      },
    })
  ).catch((err: unknown) => {
    if (err instanceof ConflictError) {
      throw new ConflictError(`Tag "${input.name}" already exists`);
    }
    throw err;
  });

  return toTagDto(tag);
}

export async function deleteTag(userId: string, id: string): Promise<void> {
  const existing = await prisma.tag.findFirst({
    where: { id, userId },
    select: { id: true },
  });

  if (!existing) {
    throw new NotFoundError('Tag not found');
  }

  await withPrismaErrors(() => prisma.tag.delete({ where: { id } }));
}

export function toTagDto(tag: {
  id: string;
  userId: string;
  name: string;
  color: string | null;
}): Tag {
  return {
    id: tag.id,
    userId: tag.userId,
    name: tag.name,
    color: tag.color,
  };
}
