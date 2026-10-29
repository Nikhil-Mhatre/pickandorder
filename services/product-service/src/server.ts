import { app } from "./app.js";
import { env } from "./config/env.js";
import { connectKafkaProducer, disconnectKafkaProducer } from "./config/kafka.js";
import { logger } from "./config/logger.js";
import { prisma } from "./config/prisma.js";
import type { Server } from "node:http";

let server: Server | undefined;
let shuttingDown = false;

async function startServer(): Promise<void> {
  // Connect to PostgreSQL first.
  await prisma.$connect();
  logger.info("Connected to PostgreSQL");

  // Connect to Kafka before accepting HTTP requests.
  if (env.KAFKA_ENABLED === true) {
    await connectKafkaProducer();
  }

  // Start HTTP only after required dependencies are ready.
  await new Promise<void>((resolve, reject) => {
    const httpServer = app.listen(env.PORT);

    httpServer.once("listening", () => {
      server = httpServer;
      logger.info({ port: env.PORT }, "Product Service started");
      resolve();
    });

    httpServer.once("error", (error) => {
      reject(error);
    });
  });
}

async function shutdown(signal: string): Promise<void> {
  if (shuttingDown) return;
  shuttingDown = true;

  logger.info({ signal }, "Graceful shutdown started");

  const forceExitTimer = setTimeout(() => {
    logger.error("Graceful shutdown timed out; forcing exit");
    process.exit(1);
  }, 10_000);

  forceExitTimer.unref();

  try {
    if (server?.listening) {
      await new Promise<void>((resolve, reject) => {
        server!.close((error) => {
          if (error) reject(error);
          else resolve();
        });
      });
    }

    await disconnectKafkaProducer();
    await prisma.$disconnect();

    logger.info("Product Service stopped");
  } catch (error) {
    logger.error({ err: error }, "Graceful shutdown failed");
    process.exitCode = 1;
  } finally {
    clearTimeout(forceExitTimer);
  }
}

process.on("SIGINT", () => void shutdown("SIGINT"));
process.on("SIGTERM", () => void shutdown("SIGTERM"));

process.on("unhandledRejection", (reason) => {
  logger.fatal({ err: reason }, "Unhandled promise rejection");
  process.exitCode = 1;
  void shutdown("unhandledRejection");
});

startServer().catch(async (error) => {
  logger.fatal({ err: error }, "Product Service startup failed");

  process.exitCode = 1;

  try {
    await disconnectKafkaProducer();
    await prisma.$disconnect();
  } catch (cleanupError) {
    logger.error({ err: cleanupError }, "Startup cleanup failed");
  }
});
