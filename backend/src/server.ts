import { buildApp } from "./app.js";
import { env } from "./config/env.js";

const app = buildApp();

async function shutdown(signal: NodeJS.Signals): Promise<void> {
  app.log.info({ signal }, "Shutting down server");

  try {
    await app.close();
    process.exit(0);
  } catch (error) {
    app.log.error(error, "Error during shutdown");
    process.exit(1);
  }
}

process.once("SIGINT", () => {
  void shutdown("SIGINT");
});

process.once("SIGTERM", () => {
  void shutdown("SIGTERM");
});

try {
  await app.listen({
    host: env.HOST,
    port: env.PORT
  });
} catch (error) {
  app.log.error(error);
  process.exit(1);
}
