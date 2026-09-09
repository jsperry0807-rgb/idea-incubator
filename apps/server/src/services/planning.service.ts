import prisma from "../lib/prisma";
import { NotFoundError } from "../lib/errors";
import {
  PLANNING_SECTIONS,
  RISKS_SECTION,
} from "../lib/planningTemplates";
import { storage } from "./storage.service";

export async function assertIdeaOwnership(userId: string, ideaId: string): Promise<void> {
  const idea = await prisma.idea.findFirst({
    where: { id: ideaId, userId },
    select: { id: true },
  });

  if (!idea) {
    throw new NotFoundError("Idea not found");
  }
}

const ALL_SECTIONS = [...PLANNING_SECTIONS, RISKS_SECTION];

export async function listPlanningSections(userId: string, ideaId: string) {
  await assertIdeaOwnership(userId, ideaId);

  const existing = await storage.listIdeaSections(userId, ideaId);

  const sections = ALL_SECTIONS.map((section) => ({
    section,
    filename: `${section}.md`,
    exists: existing.includes(`${section}.md`),
  }));

  return {
    ideaId,
    sections,
  };
}

export async function readPlanningSection(
  userId: string,
  ideaId: string,
  section: string,
) {
  await assertIdeaOwnership(userId, ideaId);

  const filename = `${section}.md`;

  let content: string;
  try {
    content = await storage.readIdeaSection(userId, ideaId, filename);
  } catch (err) {
    if (err instanceof NotFoundError) {
      throw new NotFoundError("Planning section not found");
    }
    throw err;
  }

  return {
    section,
    content,
    exists: true,
  };
}

export async function createPlanningSection(
  userId: string,
  ideaId: string,
  section: string,
) {
  await assertIdeaOwnership(userId, ideaId);

  const filename = `${section}.md`;
  const created = await storage.createIdeaSectionIfMissing(
    userId,
    ideaId,
    filename,
  );
  const content = await storage.readIdeaSection(userId, ideaId, filename);

  return {
    section,
    content,
    exists: true,
    created,
  };
}

export async function writePlanningSection(
  userId: string,
  ideaId: string,
  section: string,
  content: string,
) {
  await assertIdeaOwnership(userId, ideaId);

  const filename = `${section}.md`;
  await storage.writeIdeaSection(userId, ideaId, filename, content);

  return {
    section,
    updatedAt: new Date().toISOString(),
  };
}
