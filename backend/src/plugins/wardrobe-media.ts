import path from "node:path";

import multipart from "@fastify/multipart";
import fastifyStatic from "@fastify/static";
import type { FastifyPluginAsync } from "fastify";
import fp from "fastify-plugin";

import { LocalWardrobeMediaStorage } from "../services/storage/local-wardrobe-media-storage.js";
import type { WardrobeMediaStorage } from "../services/storage/wardrobe-media-storage.js";

export const MAX_WARDROBE_MEDIA_FILE_SIZE = 10 * 1024 * 1024;

declare module "fastify" {
  interface FastifyInstance {
    wardrobeMediaStorage: WardrobeMediaStorage;
  }
}

const wardrobeMediaPlugin: FastifyPluginAsync = async (app) => {
  const storageRoot = path.resolve(process.cwd(), "storage", "wardrobe");
  const publicPrefix = "/uploads/wardrobe";
  const storage = new LocalWardrobeMediaStorage(storageRoot, publicPrefix);

  await storage.initialize();

  app.decorate("wardrobeMediaStorage", storage);
  await app.register(multipart, {
    limits: {
      fileSize: MAX_WARDROBE_MEDIA_FILE_SIZE,
      files: 1,
      fields: 0
    }
  });
  await app.register(fastifyStatic, {
    root: storageRoot,
    prefix: `${publicPrefix}/`,
    decorateReply: false
  });
};

export default fp(wardrobeMediaPlugin, {
  name: "wardrobe-media"
});
