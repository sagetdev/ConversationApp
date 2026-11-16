import { Router } from "express";
import { z } from "zod";
import { SUPPORTED_TTS_VOICES } from "../modules/audio/audio.types.js";
import { synthesizeSpeech } from "../modules/audio/tts.service.js";

const router = Router();

const synthesisSchema = z.object({
  text: z.string().trim().min(1).max(3000),
  languageCode: z.string().trim().min(2).max(20).optional(),
  voice: z.enum(SUPPORTED_TTS_VOICES).optional(),
});

router.post("/synthesize", async (req, res) => {
  const parsed = synthesisSchema.safeParse(req.body);

  if (!parsed.success) {
    res.status(400).json({
      success: false,
      error: "Invalid text-to-speech request.",
      details: parsed.error.flatten().fieldErrors,
    });
    return;
  }

  const result = await synthesizeSpeech(parsed.data);
  res.status(200).json({ success: true, data: result });
});

export default router;
