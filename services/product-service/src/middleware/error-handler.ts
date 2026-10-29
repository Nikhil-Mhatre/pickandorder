import type { ErrorRequestHandler, RequestHandler } from "express";
import { ZodError } from "zod";

export class HttpError extends Error {
  constructor(public statusCode: number, message: string) {
    super(message);
    this.name = "HttpError";
  }
}

export const notFoundHandler: RequestHandler = (_req, res) => {
  res.status(404).json({ error: { message: "Route not found" } });
};

export const errorHandler: ErrorRequestHandler = (error, req, res, _next) => {
  const requestId = req.id;

  if (error instanceof ZodError) {
    req.log.warn(
      { requestId, validationIssueCount: error.issues.length },
      "Request validation failed",
    );
    res.status(400).json({
      error: {
        message: "Validation failed",
        details: error.issues.map((issue) => ({
          path: issue.path.join("."),
          message: issue.message,
        })),
      },
    });
    return;
  }

  if (error instanceof HttpError) {
    // The HTTP access logger records the response status and request ID.
    res.status(error.statusCode).json({ error: { message: error.message } });
    return;
  }

  req.log.error({ err: error, requestId }, "Unhandled request error");
  res.status(500).json({ error: { message: "Internal server error", requestId } });
};
