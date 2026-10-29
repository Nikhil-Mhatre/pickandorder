import { app } from "./app.js";
import { env } from "./config/env.js";
import { logger } from "./config/logger.js";
import { prisma } from "./config/prisma.js";

const server = app.listen(env.PORT, () => {
  logger.info({ port: env.PORT }, "Product Service started");
});

server.on("error", (error) => {
  logger.fatal({ err: error }, "HTTP server failed");
  process.exitCode = 1;
});

let shuttingDown = false;

async function shutdown(signal: string) {
  if (shuttingDown) return;
  shuttingDown = true;
  logger.info({ signal }, "Graceful shutdown started");

  const forceExitTimer = setTimeout(() => {
    logger.error("Graceful shutdown timed out; forcing exit");
    process.exit(1);
  }, 10_000);
  forceExitTimer.unref();

  server.close(async (error) => {
    try {
      await prisma.$disconnect();
      if (error) {
        logger.error({ err: error }, "HTTP server failed to close cleanly");
        process.exitCode = 1;
      }
      logger.info("Product Service stopped");
    } catch (disconnectError) {
      logger.error({ err: disconnectError }, "Failed to disconnect Prisma cleanly");
      process.exitCode = 1;
    } finally {
      clearTimeout(forceExitTimer);
      if (process.exitCode && process.exitCode !== 0) process.exit(process.exitCode);
    }
  });
}

process.on("SIGINT", () => void shutdown("SIGINT"));
process.on("SIGTERM", () => void shutdown("SIGTERM"));

process.on("unhandledRejection", (reason) => {
  logger.fatal({ err: reason }, "Unhandled promise rejection");
  void shutdown("unhandledRejection");
});
