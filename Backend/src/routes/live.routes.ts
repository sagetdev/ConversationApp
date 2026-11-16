import { Router } from "express";
import rateLimit from "express-rate-limit";
import { z } from "zod";
import { createLiveSessionToken } from "../websocket/live.gateway.js";

const router = Router();

const liveTokenLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  limit: 5,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: {
    success: false,
    error: "Too many Live API token requests. Try again later.",
  },
});

const liveTokenSchema = z.object({
  sourceLanguage: z.string().trim().min(2).max(80),
  targetLanguage: z.string().trim().min(2).max(80),
}).refine((value) => value.sourceLanguage !== value.targetLanguage, {
  message: "Source and target languages must be different.",
});

router.post("/token", liveTokenLimiter, async (req, res) => {
  const parsed = liveTokenSchema.safeParse(req.body);

  if (!parsed.success) {
    res.status(400).json({
      success: false,
      error: "Invalid Live API configuration.",
      details: parsed.error.flatten().fieldErrors,
    });
    return;
  }

  const result = await createLiveSessionToken(parsed.data);
  res.status(200).json({ success: true, data: result });
});

export default router;
