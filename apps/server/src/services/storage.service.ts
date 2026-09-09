import path from "node:path";

import { NotFoundError } from "../lib/errors";
import {
  PLANNING_SECTIONS,
  PLANNING_TEMPLATES,
  getTemplate,
} from "../lib/planningTemplates";
import { LocalFileStore } from "./file-store.service";
import type { FileStore } from "./file-store.service";

/**
 * Planning-aware file storage for a single user's idea folders.
 *
 * Depends on the {@link FileStore} abstraction rather than the filesystem
 * directly, so the backend can be swapped (e.g. in-memory or object storage)
 * without touching this layer.
 */
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
  listIdeaSections(userId: string, ideaId: string): Promise<string[]>;
  deleteIdeaFolder(userId: string, ideaId: string): Promise<void>;
  ideaFolderExists(userId: string, ideaId: string): Promise<boolean>;
}

export class LocalFileStorage implements FileStorageService {
  constructor(private readonly store: FileStore) {}

  private assertMarkdown(filename: string): void {
    if (!filename.endsWith(".md")) {
      throw new NotFoundError("Invalid filename");
    }
  }

  private ideaPath(userId: string, ideaId: string): string {
    return path.join(userId, ideaId);
  }

  private ideaSectionPath(
    userId: string,
    ideaId: string,
    filename: string,
  ): string {
    return path.join(userId, ideaId, filename);
  }

  async createIdeaFolder(userId: string, ideaId: string): Promise<void> {
    const dir = this.ideaPath(userId, ideaId);
    await this.store.mkdir(dir);

    await Promise.all(
      PLANNING_SECTIONS.map((section) =>
        this.store.write(
          this.ideaSectionPath(userId, ideaId, `${section}.md`),
          PLANNING_TEMPLATES[section],
        ),
      ),
    );
  }

  async writeIdeaSection(
    userId: string,
    ideaId: string,
    filename: string,
    content: string,
  ): Promise<void> {
    this.assertMarkdown(filename);
    await this.store.write(this.ideaSectionPath(userId, ideaId, filename), content);
  }

  async readIdeaSection(
    userId: string,
    ideaId: string,
    filename: string,
  ): Promise<string> {
    this.assertMarkdown(filename);
    return this.store.read(this.ideaSectionPath(userId, ideaId, filename));
  }

  async createIdeaSectionIfMissing(
    userId: string,
    ideaId: string,
    filename: string,
  ): Promise<boolean> {
    const template = getTemplate(filename.replace(/\.md$/, ""));
    if (!template) throw new NotFoundError("Unknown planning section");
    if (!(await this.ideaFolderExists(userId, ideaId))) return false;

    const rel = this.ideaSectionPath(userId, ideaId, filename);
    if (await this.store.exists(rel)) return false;

    await this.store.write(rel, template);
    return true;
  }

  async listIdeaSections(userId: string, ideaId: string): Promise<string[]> {
    const names = await this.store.list(this.ideaPath(userId, ideaId));
    return names.filter((name) => name.endsWith(".md")).sort();
  }

  async deleteIdeaFolder(userId: string, ideaId: string): Promise<void> {
    await this.store.deleteAll(this.ideaPath(userId, ideaId));
  }

  async ideaFolderExists(userId: string, ideaId: string): Promise<boolean> {
    return this.store.exists(this.ideaPath(userId, ideaId));
  }
}

export const storage: FileStorageService = new LocalFileStorage(
  new LocalFileStore(),
);