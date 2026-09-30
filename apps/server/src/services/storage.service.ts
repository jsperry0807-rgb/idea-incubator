import path from "node:path";

import { ConflictError, NotFoundError } from "../lib/errors";
import {
  CREATED_SECTIONS_BY_TYPE,
  getTemplate,
  type PlanningSection,
} from "../lib/planningTemplates";
import { LocalFileStore } from "./file-store.service";
import type { FileStore } from "./file-store.service";
import type { IdeaProjectType } from "@repo/shared";

/**
 * Planning-aware file storage for a single user's idea folders.
 *
 * Depends on the {@link FileStore} abstraction rather than the filesystem
 * directly, so the backend can be swapped (e.g. in-memory or object storage)
 * without touching this layer.
 */
export interface FileStorageService {
  createIdeaFolder(userId: string, ideaId: string, projectType: IdeaProjectType): Promise<void>;
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
    projectType: IdeaProjectType,
  ): Promise<boolean>;
  listIdeaSections(userId: string, ideaId: string): Promise<string[]>;
  deleteIdeaFolder(userId: string, ideaId: string): Promise<void>;
  ideaFolderExists(userId: string, ideaId: string): Promise<boolean>;
  listWireframes(userId: string, ideaId: string): Promise<string[]>;
  writeWireframe(
    userId: string,
    ideaId: string,
    filename: string,
    content: string,
  ): Promise<void>;
  readWireframe(userId: string, ideaId: string, filename: string): Promise<string>;
  deleteWireframe(userId: string, ideaId: string, filename: string): Promise<void>;
}

export const WIREFRAMES_DIR = "wireframes";

export class LocalFileStorage implements FileStorageService {
  constructor(private readonly store: FileStore) {}

  private assertMarkdown(filename: string): void {
    if (!filename.endsWith(".md")) {
      throw new NotFoundError("Invalid filename");
    }
  }

  private assertHtml(filename: string): void {
    if (!filename.endsWith(".html")) {
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

  private wireframePath(
    userId: string,
    ideaId: string,
    filename: string,
  ): string {
    return path.join(userId, ideaId, WIREFRAMES_DIR, filename);
  }

  async createIdeaFolder(
    userId: string,
    ideaId: string,
    projectType: IdeaProjectType,
  ): Promise<void> {
    const dir = this.ideaPath(userId, ideaId);
    await this.store.mkdir(dir);
    await this.store.mkdir(path.join(dir, WIREFRAMES_DIR));

    await Promise.all(
      CREATED_SECTIONS_BY_TYPE[projectType].map((section: PlanningSection) =>
        this.store.write(
          this.ideaSectionPath(userId, ideaId, `${section}.md`),
          getTemplate(projectType, section)!,
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
    projectType: IdeaProjectType,
  ): Promise<boolean> {
    const template = getTemplate(
      projectType,
      filename.replace(/\.md$/, ""),
    );
    if (!template) throw new NotFoundError("Unknown planning section");
    if (!(await this.ideaFolderExists(userId, ideaId))) {
      await this.createIdeaFolder(userId, ideaId, projectType);
    }

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

  async listWireframes(userId: string, ideaId: string): Promise<string[]> {
    const names = await this.store.list(
      path.join(this.ideaPath(userId, ideaId), WIREFRAMES_DIR),
    );
    return names.filter((name) => name.endsWith(".html")).sort();
  }

  async writeWireframe(
    userId: string,
    ideaId: string,
    filename: string,
    content: string,
  ): Promise<void> {
    this.assertHtml(filename);
    const dir = path.join(this.ideaPath(userId, ideaId), WIREFRAMES_DIR);
    if (!(await this.store.exists(dir))) {
      await this.store.mkdir(dir);
    }
    const rel = this.wireframePath(userId, ideaId, filename);
    if (await this.store.exists(rel)) {
      throw new ConflictError("Wireframe already exists");
    }
    await this.store.write(rel, content);
  }

  async readWireframe(
    userId: string,
    ideaId: string,
    filename: string,
  ): Promise<string> {
    this.assertHtml(filename);
    return this.store.read(this.wireframePath(userId, ideaId, filename));
  }

  async deleteWireframe(
    userId: string,
    ideaId: string,
    filename: string,
  ): Promise<void> {
    this.assertHtml(filename);
    const rel = this.wireframePath(userId, ideaId, filename);
    if (!(await this.store.exists(rel))) {
      throw new NotFoundError("Wireframe not found");
    }
    await this.store.deleteAll(rel);
  }
}

export const storage: FileStorageService = new LocalFileStorage(
  new LocalFileStore(),
);
