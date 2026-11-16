import { Router } from "express";
import { env } from "../config/env.js";
import { prisma } from "../lib/prisma.js";
import { asyncHandler } from "../lib/async-handler.js";
import { sendSuccess } from "../lib/api-response.js";

const router = Router();

router.get("/", asyncHandler(async (_req, res) => {
  await prisma.$queryRaw`SELECT 1`;

  sendSuccess(res, {
    service: "ConversationApp API",
    status: "healthy",
    dependencies: {
      database: "connected",
      geminiConfigured: Boolean(env.GEMINI_API_KEY),
      models: {
        text: env.GEMINI_TEXT_MODEL,
        live: env.GEMINI_LIVE_MODEL,
        textToSpeech: env.GEMINI_TTS_MODEL
      }
    },
    timestamp: new Date().toISOString()
  });
}));

export default router;
