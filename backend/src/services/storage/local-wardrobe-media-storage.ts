import { randomUUID } from "node:crypto";
import { mkdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";

import type {
  SaveWardrobeMediaInput,
  StoredWardrobeMedia,
  WardrobeMediaStorage
} from "./wardrobe-media-storage.js";

const fileExtensions: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp"
};

export class LocalWardrobeMediaStorage implements WardrobeMediaStorage {
  constructor(
    private readonly rootDirectory: string,
    private readonly publicPrefix: string
  ) {}

  async initialize(): Promise<void> {
    await mkdir(this.rootDirectory, { recursive: true });
  }

  async save(input: SaveWardrobeMediaInput): Promise<StoredWardrobeMedia> {
    const extension = fileExtensions[input.mediaType];

    if (extension === undefined) {
      throw new Error("Unsupported wardrobe media type.");
    }

    const storageKey = `${randomUUID()}${extension}`;
    await writeFile(this.resolveStoragePath(storageKey), input.data, { flag: "wx" });

    return {
      storageKey,
      url: this.getUrl(storageKey)
    };
  }

  async delete(storageKey: string): Promise<void> {
    await rm(this.resolveStoragePath(storageKey), { force: true });
  }

  getUrl(storageKey: string): string {
    return `${this.publicPrefix}/${encodeURIComponent(storageKey)}`;
  }

  private resolveStoragePath(storageKey: string): string {
    if (path.basename(storageKey) !== storageKey) {
      throw new Error("Invalid wardrobe media storage key.");
    }

    return path.join(this.rootDirectory, storageKey);
  }
}
