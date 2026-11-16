import type { ErrorRequestHandler } from "express";
import { ZodError } from "zod";
import { AppError } from "../lib/errors.js";
import { sendError } from "../lib/api-response.js";

export const errorMiddleware: ErrorRequestHandler = (error, _req, res, _next) => {
  if (error instanceof ZodError) {
    sendError(res, 400, "VALIDATION_ERROR", "The request body or parameters are invalid.");
    return;
  }
  if (error instanceof AppError) {
    sendError(res, error.statusCode, error.code, error.message);
    return;
  }
  console.error("Unhandled API error:", error);
  sendError(res, 500, "INTERNAL_SERVER_ERROR", "An unexpected server error occurred.");
};
