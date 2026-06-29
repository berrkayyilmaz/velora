export type SaveWardrobeMediaInput = {
  data: Buffer;
  mediaType: string;
};

export type StoredWardrobeMedia = {
  storageKey: string;
  url: string;
};

export interface WardrobeMediaStorage {
  save(input: SaveWardrobeMediaInput): Promise<StoredWardrobeMedia>;
  delete(storageKey: string): Promise<void>;
  getUrl(storageKey: string): string;
}
