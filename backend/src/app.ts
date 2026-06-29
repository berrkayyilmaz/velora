import Fastify, { type FastifyInstance } from "fastify";

import { env } from "./config/env.js";
import corsPlugin from "./plugins/cors.js";
import errorHandlerPlugin from "./plugins/error-handler.js";
import prismaPlugin from "./plugins/prisma.js";
import rateLimitPlugin from "./plugins/rate-limit.js";
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
import wardrobeRoutes from "./routes/wardrobe.routes.js";
import wishlistRoutes from "./routes/wishlist.routes.js";

const API_PREFIX = "/api/v1";

export function buildApp(): FastifyInstance {
  const app = Fastify({
    logger: env.NODE_ENV !== "test"
  });

  app.register(errorHandlerPlugin);
  app.register(corsPlugin);
  app.register(rateLimitPlugin);
  app.register(prismaPlugin);
  app.register(healthRoutes, { prefix: "/health" });
  app.register(healthRoutes, { prefix: `${API_PREFIX}/health` });
  app.register(authRoutes, { prefix: `${API_PREFIX}/auth` });
  app.register(profileRoutes, { prefix: `${API_PREFIX}/me` });
  app.register(productRoutes, { prefix: `${API_PREFIX}/products` });
  app.register(wishlistRoutes, { prefix: `${API_PREFIX}/wishlist` });
  app.register(outfitRoutes, { prefix: `${API_PREFIX}/outfits` });
  app.register(redirectRoutes, { prefix: `${API_PREFIX}/redirects` });
  app.register(analyticsRoutes, { prefix: `${API_PREFIX}/analytics` });
  app.register(wardrobeRoutes, { prefix: `${API_PREFIX}/wardrobe` });
  app.register(adminRoutes, { prefix: `${API_PREFIX}/admin` });
  app.register(adminCatalogRoutes, { prefix: `${API_PREFIX}/admin` });
  app.register(adminAnalyticsRoutes, { prefix: `${API_PREFIX}/admin/analytics` });
  app.register(adminProductRoutes, { prefix: `${API_PREFIX}/admin/products` });

  return app;
}
