import type { ErrorRequestHandler } from "express";
import { ZodError } from "zod";
import { AppError } from "../lib/errors.js";
import { sendError } from "../lib/api-response.js";

type HttpError = Error & {
  status?: number;
  statusCode?: number;
  type?: string;
};

export const errorMiddleware: ErrorRequestHandler = (error: unknown, _req, res, _next) => {
  if (error instanceof ZodError) {
    sendError(res, 400, "VALIDATION_ERROR", "The request body or parameters are invalid.");
    return;
  }

  if (error instanceof AppError) {
    sendError(res, error.statusCode, error.code, error.message);
    return;
  }

  if (error instanceof SyntaxError && "status" in error && (error as HttpError).status === 400) {
    sendError(res, 400, "INVALID_JSON", "The request body contains invalid JSON.");
    return;
  }

  const httpError = error instanceof Error ? error as HttpError : undefined;
  if (httpError?.type === "entity.too.large" || httpError?.status === 413) {
    sendError(res, 413, "PAYLOAD_TOO_LARGE", "The request body exceeds the allowed size.");
    return;
  }

  if (httpError?.message === "Origin is not allowed by CORS.") {
    sendError(res, 403, "ORIGIN_NOT_ALLOWED", "This origin is not allowed to access the API.");
    return;
  }

  console.error("Unhandled API error:", error);
  sendError(res, 500, "INTERNAL_SERVER_ERROR", "An unexpected server error occurred.");
};
