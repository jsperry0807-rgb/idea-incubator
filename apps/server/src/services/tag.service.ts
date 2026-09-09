import prisma from "../lib/prisma";
import { ConflictError, NotFoundError } from "../lib/errors";
import type {
  CreateTagInput,
  Tag,
  UpdateTagInput,
} from "@repo/shared";

export async function listTags(userId: string): Promise<Tag[]> {
  const tags = await prisma.tag.findMany({
    where: { userId },
    orderBy: { name: "asc" },
  });

  return tags.map(toTagDto);
}

export async function createTag(userId: string, input: CreateTagInput): Promise<Tag> {
  const existing = await prisma.tag.findUnique({
    where: { userId_name: { userId, name: input.name } },
  });

  if (existing) {
    throw new ConflictError(`Tag "${input.name}" already exists`);
  }

  const tag = await prisma.tag.create({
    data: {
      userId,
      name: input.name,
      color: input.color ?? null,
    },
  });

  return toTagDto(tag);
}

export async function updateTag(
  userId: string,
  id: string,
  input: UpdateTagInput,
): Promise<Tag> {
  const existing = await prisma.tag.findFirst({
    where: { id, userId },
    select: { id: true, name: true },
  });

  if (!existing) {
    throw new NotFoundError("Tag not found");
  }

  if (input.name && input.name !== existing.name) {
    const collision = await prisma.tag.findUnique({
      where: { userId_name: { userId, name: input.name } },
      select: { id: true },
    });
    if (collision) {
      throw new ConflictError(`Tag "${input.name}" already exists`);
    }
  }

  const tag = await prisma.tag.update({
    where: { id },
    data: {
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.color !== undefined ? { color: input.color ?? null } : {}),
    },
  });

  return toTagDto(tag);
}

export async function deleteTag(userId: string, id: string): Promise<void> {
  const existing = await prisma.tag.findFirst({
    where: { id, userId },
    select: { id: true },
  });

  if (!existing) {
    throw new NotFoundError("Tag not found");
  }

  await prisma.tag.delete({ where: { id } });
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