import Fastify, { type FastifyInstance } from "fastify";

import { env } from "./config/env.js";
import prismaPlugin from "./plugins/prisma.js";
import authRoutes from "./routes/auth.routes.js";
import healthRoutes from "./routes/health.routes.js";
import outfitRoutes from "./routes/outfit.routes.js";
import productRoutes from "./routes/product.routes.js";
import profileRoutes from "./routes/profile.routes.js";
import redirectRoutes from "./routes/redirect.routes.js";
import wishlistRoutes from "./routes/wishlist.routes.js";

export function buildApp(): FastifyInstance {
  const app = Fastify({
    logger: env.NODE_ENV !== "test"
  });

  app.register(prismaPlugin);
  app.register(healthRoutes, { prefix: "/health" });
  app.register(authRoutes, { prefix: "/auth" });
  app.register(profileRoutes, { prefix: "/profile" });
  app.register(productRoutes, { prefix: "/products" });
  app.register(wishlistRoutes, { prefix: "/wishlist" });
  app.register(outfitRoutes, { prefix: "/outfits" });
  app.register(redirectRoutes, { prefix: "/redirects" });

  return app;
}
