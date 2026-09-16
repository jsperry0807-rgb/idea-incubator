import { NotFoundError } from "../lib/errors";
import { sectionsForType, type PlanningSection } from "../lib/planningTemplates";
import { storage } from "./storage.service";
import {
  assertIdeaOwnership,
} from "./idea.service";

export async function listPlanningSections(userId: string, ideaId: string) {
  const projectType = await assertIdeaOwnership(userId, ideaId);

  const existing = await storage.listIdeaSections(userId, ideaId);
  const { created, onDemand } = sectionsForType(projectType);

  const sections = [...created, ...onDemand].map((section: PlanningSection) => ({
    section,
    filename: `${section}.md`,
    exists: existing.includes(`${section}.md`),
  }));

  return {
    ideaId,
    projectType,
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
  const projectType = await assertIdeaOwnership(userId, ideaId);

  const filename = `${section}.md`;
  const created = await storage.createIdeaSectionIfMissing(
    userId,
    ideaId,
    filename,
    projectType,
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
