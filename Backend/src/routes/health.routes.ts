import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { asyncHandler } from "../lib/async-handler.js";
import { sendSuccess } from "../lib/api-response.js";

const router = Router();

router.get("/", asyncHandler(async (_req, res) => {
  await prisma.$queryRawUnsafe("SELECT 1");
  sendSuccess(res, {
    service: "ConversationApp API",
    status: "healthy",
    dependencies: {
      database: "connected",
      geminiConfigured: Boolean(process.env.GEMINI_API_KEY)
    },
    timestamp: new Date().toISOString()
  });
}));

export default router;
