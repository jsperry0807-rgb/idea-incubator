import { access, mkdir, readdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";

import { env } from "../config/env";
import { NotFoundError } from "../lib/errors";

/**
 * Low-level, storage-agnostic file read/write primitive.
 *
 * All operations are addressed by a relative path and resolve against a
 * single storage root, so higher layers (e.g. planning folders) never deal
 * with absolute paths and can be swapped onto a different backend later.
 */
export interface FileStore {
  read(relPath: string): Promise<string>;
  write(relPath: string, content: string): Promise<void>;
  exists(relPath: string): Promise<boolean>;
  deleteAll(relPath: string): Promise<void>;
  list(relPath: string): Promise<string[]>;
  mkdir(relPath: string): Promise<void>;
}

/** Local-disk implementation of {@link FileStore}. */
export class LocalFileStore implements FileStore {
  private readonly root: string;

  constructor(root = env.STORAGE_PATH) {
    this.root = path.resolve(root, "content");
  }

  // Resolves a relative path under the storage root and rejects any attempt
  // to escape it (path traversal prevention).
  private safeResolve(relPath: string): string {
    const full = path.resolve(this.root, relPath);
    if (full !== this.root && !full.startsWith(`${this.root}${path.sep}`)) {
      throw new NotFoundError("Invalid path");
    }
    return full;
  }

  async read(relPath: string): Promise<string> {
    try {
      return await readFile(this.safeResolve(relPath), "utf8");
    } catch {
      throw new NotFoundError("File not found");
    }
  }

  async write(relPath: string, content: string): Promise<void> {
    await writeFile(this.safeResolve(relPath), content, "utf8");
  }

  async exists(relPath: string): Promise<boolean> {
    try {
      await access(this.safeResolve(relPath));
      return true;
    } catch {
      return false;
    }
  }

  async deleteAll(relPath: string): Promise<void> {
    await rm(this.safeResolve(relPath), { recursive: true, force: true });
  }

  async list(relPath: string): Promise<string[]> {
    try {
      return await readdir(this.safeResolve(relPath));
    } catch {
      return [];
    }
  }

  async mkdir(relPath: string): Promise<void> {
    await mkdir(this.safeResolve(relPath), { recursive: true });
  }
}