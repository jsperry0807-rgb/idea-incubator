import { access, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";

import { env } from "../config/env";
import { NotFoundError } from "../lib/errors";
import {
  PLANNING_SECTIONS,
  PLANNING_TEMPLATES,
  getTemplate,
} from "../lib/planningTemplates";

export interface FileStorageService {
  createIdeaFolder(userId: string, ideaId: string): Promise<void>;
  writeIdeaSection(
    userId: string,
    ideaId: string,
    filename: string,
    content: string,
  ): Promise<void>;
  readIdeaSection(
    userId: string,
    ideaId: string,
    filename: string,
  ): Promise<string>;
  createIdeaSectionIfMissing(
    userId: string,
    ideaId: string,
    filename: string,
  ): Promise<boolean>;
  deleteIdeaFolder(userId: string, ideaId: string): Promise<void>;
  ideaFolderExists(userId: string, ideaId: string): Promise<boolean>;
}

export class LocalFileStorage implements FileStorageService {
  private readonly root: string;

  constructor(root = env.STORAGE_PATH) {
    this.root = path.resolve(root, "content");
  }

  // Resolves segments under the storage root and rejects any path traversal.
  private safeResolve(...segments: string[]): string {
    const full = path.resolve(this.root, ...segments);
    if (full !== this.root && !full.startsWith(`${this.root}${path.sep}`)) {
      throw new NotFoundError("Invalid path");
    }
    return full;
  }

  async createIdeaFolder(userId: string, ideaId: string): Promise<void> {
    const dir = this.safeResolve(userId, ideaId);
    await mkdir(dir, { recursive: true });

    await Promise.all(
      PLANNING_SECTIONS.map((section) =>
        writeFile(path.join(dir, `${section}.md`), PLANNING_TEMPLATES[section], "utf8"),
      ),
    );
  }

  async writeIdeaSection(
    userId: string,
    ideaId: string,
    filename: string,
    content: string,
  ): Promise<void> {
    if (!filename.endsWith(".md")) throw new NotFoundError("Invalid filename");
    const file = this.safeResolve(userId, ideaId, filename);
    await writeFile(file, content, "utf8");
  }

  async readIdeaSection(
    userId: string,
    ideaId: string,
    filename: string,
  ): Promise<string> {
    if (!filename.endsWith(".md")) throw new NotFoundError("Invalid filename");
    const file = this.safeResolve(userId, ideaId, filename);
    try {
      return await readFile(file, "utf8");
    } catch {
      throw new NotFoundError("Planning section not found");
    }
  }

  async createIdeaSectionIfMissing(
    userId: string,
    ideaId: string,
    filename: string,
  ): Promise<boolean> {
    const template = getTemplate(filename.replace(/\.md$/, ""));
    if (!template) throw new NotFoundError("Unknown planning section");
    if (await this.ideaFolderExists(userId, ideaId)) {
      const file = this.safeResolve(userId, ideaId, filename);
      try {
        await access(file);
        return false;
      } catch {
        await this.writeIdeaSection(userId, ideaId, filename, template);
        return true;
      }
    }
    return false;
  }

  async deleteIdeaFolder(userId: string, ideaId: string): Promise<void> {
    const dir = this.safeResolve(userId, ideaId);
    await rm(dir, { recursive: true, force: true });
  }

  async ideaFolderExists(userId: string, ideaId: string): Promise<boolean> {
    const dir = this.safeResolve(userId, ideaId);
    try {
      await access(dir);
      return true;
    } catch {
      return false;
    }
  }
}

export const storage: FileStorageService = new LocalFileStorage();