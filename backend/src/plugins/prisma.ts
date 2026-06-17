import type { PrismaClient } from "@prisma/client";
import type { FastifyPluginCallback } from "fastify";
import fp from "fastify-plugin";

import { prisma } from "../config/prisma.js";

declare module "fastify" {
  interface FastifyInstance {
    prisma: PrismaClient;
  }
}

const prismaPlugin: FastifyPluginCallback = (app, _options, done) => {
  if (!app.hasDecorator("prisma")) {
    app.decorate("prisma", prisma);
  }

  app.addHook("onClose", async (instance) => {
    await instance.prisma.$disconnect();
  });

  done();
};

export default fp(prismaPlugin, {
  name: "prisma"
});
