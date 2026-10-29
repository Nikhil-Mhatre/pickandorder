import pino from "pino";
import { env } from "./env.js";

export const logger = pino({
  level: env.LOG_LEVEL ?? (env.NODE_ENV === "production" ? "info" : "debug"),
  base: {
    service: "product-service",
    environment: env.NODE_ENV,
  },
  timestamp: pino.stdTimeFunctions.isoTime,
  redact: {
    paths: [
      "password",
      "*.password",
      "authorization",
      "*.authorization",
      "cookie",
      "*.cookie",
      "accessToken",
      "refreshToken",
      "DATABASE_URL",
    ],
    censor: "[REDACTED]",
  },
  ...(env.NODE_ENV === "development" && {
    transport: {
      target: "pino-pretty",
      options: {
        colorize: true,
        translateTime: "SYS:standard",
        ignore: "pid,hostname",
        singleLine: false,
      },
    },
  }),
});
