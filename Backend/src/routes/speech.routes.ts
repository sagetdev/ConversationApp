import { Router } from "express";
import { z } from "zod";
import { SUPPORTED_AUDIO_MIME_TYPES } from "../modules/speech/speech.types.js";
import { transcribeAudio } from "../modules/speech/speech.service.js";

const router = Router();

const transcriptionSchema = z.object({
  audioBase64: z.string().min(1).max(12_000_000),
  mimeType: z.enum(SUPPORTED_AUDIO_MIME_TYPES),
  language: z.string().trim().min(2).max(80).optional(),
});

router.post("/transcribe", async (req, res) => {
  const parsed = transcriptionSchema.safeParse(req.body);

  if (!parsed.success) {
    res.status(400).json({
      success: false,
      error: "Invalid audio request.",
      details: parsed.error.flatten().fieldErrors,
    });
    return;
  }

  const result = await transcribeAudio(parsed.data);
  res.status(200).json({ success: true, data: result });
});

export default router;
