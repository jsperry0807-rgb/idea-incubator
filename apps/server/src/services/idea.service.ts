import type { Prisma } from '../generated/prisma/client';
import { Prisma as PrismaNS } from '../generated/prisma/client';
import prisma from '../lib/prisma';
import { ConflictError, NotFoundError } from '../lib/errors';
import { ensureUniqueSlug, slugify } from '../lib/slug';
import { sectionsForType } from '../lib/planningTemplates';
import { storage } from './storage.service';
import type {
  CreateIdeaInput,
  IdeaPipeline,
  IdeaPriority,
  IdeaProjectType,
  IdeaStatus,
  PipelineIdea,
  Tag,
  UpdateIdeaInput,
} from '@repo/shared';

export interface IdeaListQuery {
  page?: number;
  pageSize?: number;
  status?: string;
  priority?: string;
  search?: string;
  tagId?: string;
  sort?: 'createdAt' | 'updatedAt' | 'title';
  order?: 'asc' | 'desc';
}

const IDEA_INCLUDE = {
  tags: { include: { tag: true } },
  user: { select: { id: true, name: true, avatarUrl: true } },
} satisfies Prisma.IdeaInclude;

export async function assertIdeaOwnership(
  userId: string,
  ideaId: string
): Promise<IdeaProjectType> {
  const idea = await prisma.idea.findFirst({
    where: { id: ideaId, userId },
    select: { id: true, projectType: true },
  });

  if (!idea) {
    throw new NotFoundError('Idea not found');
  }

  return idea.projectType;
}

export async function assertIdeaAccess(userId: string, ideaId: string): Promise<void> {
  const idea = await prisma.idea.findFirst({
    where: { id: ideaId },
    select: { userId: true },
  });

  if (!idea) {
    throw new NotFoundError('Idea not found');
  }

  if (idea.userId === userId) {
    return;
  }

  const share = await prisma.share.findUnique({
    where: { ideaId_userId: { ideaId, userId } },
    select: { id: true },
  });

  if (!share) {
    throw new NotFoundError('Idea not found');
  }
}

export async function listIdeas(userId: string, query: IdeaListQuery) {
  const page = query.page ?? 1;
  const pageSize = query.pageSize ?? 20;
  const order: Prisma.SortOrder = query.order === 'asc' ? 'asc' : 'desc';
  const sortField = query.sort ?? 'createdAt';

  const where: Prisma.IdeaWhereInput = {
    userId,
  };

  if (query.status) {
    const statuses = query.status
      .split(',')
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
        { title: { contains: term, mode: 'insensitive' } },
        { description: { contains: term, mode: 'insensitive' } },
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
    throw new NotFoundError('Idea not found');
  }

  return toIdeaDto(idea);
}

export async function getPipeline(userId: string): Promise<IdeaPipeline> {
  const ideas = await prisma.idea.findMany({
    where: { userId },
    include: {
      tags: { include: { tag: true } },
      tasks: { select: { completed: true } },
    },
    orderBy: { updatedAt: 'desc' },
  });

  const pipeline: IdeaPipeline = {
    IDEA: [],
    PLANNING: [],
    PLANNED: [],
    IN_PROGRESS: [],
    DONE: [],
    ARCHIVED: [],
  };

  for (const idea of ideas) {
    pipeline[idea.status].push(toPipelineIdeaDto(idea));
  }

  return pipeline;
}

export async function createIdea(userId: string, input: CreateIdeaInput) {
  const projectType = input.projectType ?? 'SOFTWARE';

  const idea = await withSlugCollisionRetry(
    () => generateUniqueSlug(userId, input.title),
    (slug) =>
      prisma.idea.create({
        data: {
          userId,
          title: input.title,
          slug,
          description: input.description ?? null,
          status: input.status ?? 'IDEA',
          priority: input.priority ?? 'NONE',
          projectType,
          tags: input.tagIds?.length
            ? {
                create: input.tagIds.map((tagId) => ({ tagId })),
              }
            : undefined,
        },
        include: IDEA_INCLUDE,
      })
  );

  try {
    await storage.createIdeaFolder(userId, idea.id, projectType);
  } catch (err) {
    await prisma.idea.delete({ where: { id: idea.id } }).catch(() => {});
    throw err;
  }

  return toIdeaDto(idea);
}

export async function updateIdea(userId: string, id: string, input: UpdateIdeaInput) {
  const existing = await prisma.idea.findFirst({
    where: { id, userId },
    select: { id: true, title: true, projectType: true },
  });

  if (!existing) {
    throw new NotFoundError('Idea not found');
  }

  const renamesSlug = Boolean(input.title && input.title !== existing.title);

  const data: Prisma.IdeaUpdateInput = {
    ...(input.title !== undefined ? { title: input.title } : {}),
    ...(input.description !== undefined ? { description: input.description ?? null } : {}),
    ...(input.status !== undefined ? { status: input.status } : {}),
    ...(input.priority !== undefined ? { priority: input.priority } : {}),
    ...(input.projectType !== undefined ? { projectType: input.projectType } : {}),
  };

  if (input.tagIds !== undefined) {
    data.tags = {
      deleteMany: {},
      create: input.tagIds.map((tagId) => ({ tagId })),
    };
  }

  const idea = renamesSlug
    ? await withSlugCollisionRetry(
        () => generateUniqueSlug(userId, input.title!, existing.id),
        (slug) =>
          prisma.idea.update({ where: { id }, data: { ...data, slug }, include: IDEA_INCLUDE })
      )
    : await prisma.idea.update({ where: { id }, data, include: IDEA_INCLUDE });

  if (input.projectType && input.projectType !== existing.projectType) {
    await scaffoldSectionsForType(userId, id, input.projectType).catch(() => {});
  }

  return toIdeaDto(idea);
}

export async function deleteIdea(userId: string, id: string) {
  const existing = await prisma.idea.findFirst({
    where: { id, userId },
    select: { id: true },
  });

  if (!existing) {
    throw new NotFoundError('Idea not found');
  }

  await prisma.idea.delete({ where: { id } });
  await storage.deleteIdeaFolder(userId, id).catch(() => {});
}

async function scaffoldSectionsForType(
  userId: string,
  ideaId: string,
  projectType: IdeaProjectType
) {
  const { created } = sectionsForType(projectType);
  if (await storage.ideaFolderExists(userId, ideaId)) {
    await Promise.all(
      created.map((section) =>
        storage.createIdeaSectionIfMissing(userId, ideaId, `${section}.md`, projectType)
      )
    );
  }
}

async function generateUniqueSlug(
  userId: string,
  title: string,
  excludeId?: string
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
    collisions.map((c) => c.slug)
  );
}

/** Prisma's unique-constraint violation. */
function isUniqueViolation(err: unknown): boolean {
  return err instanceof PrismaNS.PrismaClientKnownRequestError && err.code === 'P2002';
}

/**
 * Resolves a slug and retries once per collision.
 *
 * The probe in {@link generateUniqueSlug} and the write are not atomic, so two
 * concurrent creates can both settle on the same slug. That surfaces as P2002,
 * which the error handler does not translate and would otherwise reach the
 * client as a 500. Re-running the probe picks up the row the winner just wrote.
 */
const SLUG_COLLISION_RETRIES = 3;

async function withSlugCollisionRetry<T>(
  pickSlug: () => Promise<string>,
  write: (slug: string) => Promise<T>
): Promise<T> {
  for (let attempt = 0; attempt <= SLUG_COLLISION_RETRIES; attempt++) {
    const slug = await pickSlug();
    try {
      return await write(slug);
    } catch (err) {
      if (!isUniqueViolation(err)) throw err;
    }
  }

  throw new ConflictError('Could not allocate a unique slug; please retry with a different title.');
}

export function toIdeaTags(ideaTags: { tagId: string; tag: Tag }[]) {
  return ideaTags.map(({ tagId, tag }) => ({
    tagId,
    tag: {
      id: tag.id,
      userId: tag.userId,
      name: tag.name,
      color: tag.color,
    },
  }));
}

function toIdeaDto(idea: {
  id: string;
  userId: string;
  title: string;
  slug: string;
  description: string | null;
  status: IdeaStatus;
  priority: IdeaPriority;
  projectType: IdeaProjectType;
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
    projectType: idea.projectType,
    createdAt: idea.createdAt.toISOString(),
    updatedAt: idea.updatedAt.toISOString(),
    tags: toIdeaTags(idea.tags),
  };
}

function toPipelineIdeaDto(idea: {
  id: string;
  userId: string;
  title: string;
  slug: string;
  description: string | null;
  status: IdeaStatus;
  priority: IdeaPriority;
  tags: { tagId: string; tag: Tag }[];
  tasks: { completed: boolean }[];
  createdAt: Date;
  updatedAt: Date;
}): PipelineIdea {
  return {
    id: idea.id,
    userId: idea.userId,
    title: idea.title,
    slug: idea.slug,
    description: idea.description,
    status: idea.status,
    priority: idea.priority,
    tags: toIdeaTags(idea.tags),
    taskCount: idea.tasks.length,
    completedTaskCount: idea.tasks.filter((task) => task.completed).length,
    createdAt: idea.createdAt.toISOString(),
    updatedAt: idea.updatedAt.toISOString(),
  };
}
