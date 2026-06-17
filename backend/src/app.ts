import Fastify, { type FastifyInstance } from "fastify";

import { env } from "./config/env.js";
import prismaPlugin from "./plugins/prisma.js";
import adminAnalyticsRoutes from "./routes/admin-analytics.routes.js";
import adminCatalogRoutes from "./routes/admin-catalog.routes.js";
import adminProductRoutes from "./routes/admin-product.routes.js";
import adminRoutes from "./routes/admin.routes.js";
import analyticsRoutes from "./routes/analytics.routes.js";
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
  app.register(analyticsRoutes, { prefix: "/analytics" });
  app.register(adminRoutes, { prefix: "/admin" });
  app.register(adminCatalogRoutes, { prefix: "/admin" });
  app.register(adminAnalyticsRoutes, { prefix: "/admin/analytics" });
  app.register(adminProductRoutes, { prefix: "/admin/products" });

  return app;
}
