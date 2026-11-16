import { Router } from "express";
import { z } from "zod";
import { asyncHandler } from "../lib/async-handler.js";
import { sendSuccess } from "../lib/api-response.js";
import { synthesizeSpeech } from "../modules/audio/tts.service.js";

const router = Router();

const speechSchema = z.object({
  text: z.string().trim().min(1).max(1000),
  language: z.string().min(2).max(40)
});

router.post("/speech", asyncHandler(async (req, res) => {
  const input = speechSchema.parse(req.body);
  const audio = await synthesizeSpeech(input);
  sendSuccess(res, audio);
}));

export default router;
