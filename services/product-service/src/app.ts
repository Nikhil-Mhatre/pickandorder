import { randomUUID } from "node:crypto";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import { pinoHttp } from "pino-http";
import { env } from "./config/env.js";
import { logger } from "./config/logger.js";
import { errorHandler, notFoundHandler } from "./middleware/error-handler.js";
import { productRouter } from "./routes/product.routes.js";

const requestIdPattern = /^[a-zA-Z0-9._-]{1,128}$/;

export const app = express();

app.disable("x-powered-by");
app.use(
  pinoHttp({
    logger,
    genReqId: (req, res) => {
      const header = req.headers["x-request-id"];
      const requestId =
        typeof header === "string" && requestIdPattern.test(header) ? header : randomUUID();

      res.setHeader("x-request-id", requestId);
      return requestId;
    },
    customProps: () => ({ service: "product-service" }),
    customAttributeKeys: { reqId: "requestId" },
    serializers: {
      req: (req) => ({
        id: req.id,
        method: req.method,
        // Exclude query strings because they can contain tokens or personal data.
        url: req.url.split("?")[0],
      }),
      res: (res) => ({ statusCode: res.statusCode }),
    },
    customLogLevel: (_req, res, err) => {
      if (err || res.statusCode >= 500) return "error";
      if (res.statusCode >= 400) return "warn";
      return "info";
    },
  }),
);
app.use(helmet());
app.use(cors({ origin: env.CORS_ORIGIN.split(",").map((origin) => origin.trim()) }));
app.use(express.json({ limit: "1mb" }));

app.get("/health", (_req, res) => {
  res.status(200).json({ status: "ok", service: "product-service" });
});

app.use("/api/v1/products", productRouter);
app.use(notFoundHandler);
app.use(errorHandler);
