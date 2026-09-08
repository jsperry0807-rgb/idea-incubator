import type { Prisma } from "../generated/prisma/client";
import prisma from "../lib/prisma";
import { NotFoundError } from "../lib/errors";
import { ensureUniqueSlug, slugify } from "../lib/slug";
import { storage } from "./storage.service";
import type {
  CreateIdeaInput,
  IdeaPriority,
  IdeaStatus,
  Tag,
  UpdateIdeaInput,
} from "@repo/shared";

export interface IdeaListQuery {
  page?: number;
  pageSize?: number;
  status?: string;
  priority?: string;
  search?: string;
  tagId?: string;
  sort?: "createdAt" | "updatedAt" | "title";
  order?: "asc" | "desc";
}

const IDEA_INCLUDE = {
  tags: { include: { tag: true } },
  user: { select: { id: true, name: true, avatarUrl: true } },
} satisfies Prisma.IdeaInclude;

export async function assertIdeaOwnership(
  userId: string,
  ideaId: string,
): Promise<void> {
  const idea = await prisma.idea.findFirst({
    where: { id: ideaId, userId },
    select: { id: true },
  });

  if (!idea) {
    throw new NotFoundError("Idea not found");
  }
}

export async function listIdeas(userId: string, query: IdeaListQuery) {
  const page = query.page ?? 1;
  const pageSize = query.pageSize ?? 20;
  const order: Prisma.SortOrder = query.order === "asc" ? "asc" : "desc";
  const sortField = query.sort ?? "createdAt";

  const where: Prisma.IdeaWhereInput = {
    userId,
  };

  if (query.status) {
    const statuses = query.status
      .split(",")
      .map((s) => s.trim() as IdeaStatus)
      .filter(Boolean);
    if (statuses.length > 0) {
      where.status = { in: statuses };
    }
  }

  if (query.priority) {
    where.priority = query.priority as never;
  }

  if (query.tagId) {
    where.tags = { some: { tagId: query.tagId } };
  }

  if (query.search) {
    const term = query.search.trim();
    if (term) {
      where.OR = [
        { title: { contains: term, mode: "insensitive" } },
        { description: { contains: term, mode: "insensitive" } },
      ];
    }
  }

  const [items, total] = await prisma.$transaction([
    prisma.idea.findMany({
      where,
      include: IDEA_INCLUDE,
      orderBy: { [sortField]: order },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.idea.count({ where }),
  ]);

  return {
    items: items.map(toIdeaDto),
    meta: {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
    },
  };
}

export async function getIdea(userId: string, id: string) {
  const idea = await prisma.idea.findFirst({
    where: { id, userId },
    include: IDEA_INCLUDE,
  });

  if (!idea) {
    throw new NotFoundError("Idea not found");
  }

  return toIdeaDto(idea);
}

export async function createIdea(userId: string, input: CreateIdeaInput) {
  const slug = await generateUniqueSlug(userId, input.title);

  const idea = await prisma.idea.create({
    data: {
      userId,
      title: input.title,
      slug,
      description: input.description ?? null,
      status: input.status ?? "IDEA",
      priority: input.priority ?? "NONE",
      tags: input.tagIds?.length
        ? {
            create: input.tagIds.map((tagId) => ({ tagId })),
          }
        : undefined,
    },
    include: IDEA_INCLUDE,
  });

  try {
    await storage.createIdeaFolder(userId, idea.id);
  } catch (err) {
    await prisma.idea.delete({ where: { id: idea.id } }).catch(() => {});
    throw err;
  }

  return toIdeaDto(idea);
}

export async function updateIdea(
  userId: string,
  id: string,
  input: UpdateIdeaInput,
) {
  const existing = await prisma.idea.findFirst({
    where: { id, userId },
    select: { id: true, title: true },
  });

  if (!existing) {
    throw new NotFoundError("Idea not found");
  }

  let slug: string | undefined;
  if (input.title && input.title !== existing.title) {
    slug = await generateUniqueSlug(userId, input.title, existing.id);
  }

  const data: Prisma.IdeaUpdateInput = {
    ...(input.title !== undefined ? { title: input.title } : {}),
    ...(slug !== undefined ? { slug } : {}),
    ...(input.description !== undefined
      ? { description: input.description ?? null }
      : {}),
    ...(input.status !== undefined ? { status: input.status } : {}),
    ...(input.priority !== undefined ? { priority: input.priority } : {}),
  };

  if (input.tagIds !== undefined) {
    data.tags = {
      deleteMany: {},
      create: input.tagIds.map((tagId) => ({ tagId })),
    };
  }

  const idea = await prisma.idea.update({
    where: { id },
    data,
    include: IDEA_INCLUDE,
  });

  return toIdeaDto(idea);
}

export async function deleteIdea(userId: string, id: string) {
  const existing = await prisma.idea.findFirst({
    where: { id, userId },
    select: { id: true },
  });

  if (!existing) {
    throw new NotFoundError("Idea not found");
  }

  await prisma.idea.delete({ where: { id } });
  await storage.deleteIdeaFolder(userId, id).catch(() => {});
}

async function generateUniqueSlug(
  userId: string,
  title: string,
  excludeId?: string,
): Promise<string> {
  const base = slugify(title);

  const collisions = await prisma.idea.findMany({
    where: {
      userId,
      ...(excludeId ? { id: { not: excludeId } } : {}),
      slug: { startsWith: `${base}` },
    },
    select: { slug: true },
  });

  return ensureUniqueSlug(
    base,
    collisions.map((c) => c.slug),
  );
}

function toIdeaDto(idea: {
  id: string;
  userId: string;
  title: string;
  slug: string;
  description: string | null;
  status: IdeaStatus;
  priority: IdeaPriority;
  createdAt: Date;
  updatedAt: Date;
  tags: { tagId: string; tag: Tag }[];
}) {
  return {
    id: idea.id,
    userId: idea.userId,
    title: idea.title,
    slug: idea.slug,
    description: idea.description,
    status: idea.status,
    priority: idea.priority,
    createdAt: idea.createdAt.toISOString(),
    updatedAt: idea.updatedAt.toISOString(),
    tags: idea.tags.map(({ tagId, tag }) => ({
      tagId,
      tag: {
        id: tag.id,
        userId: tag.userId,
        name: tag.name,
        color: tag.color,
      },
    })),
  };
}
