import { Router } from "express";
import { z } from "zod";
import { translateText } from "../modules/translation/translation.service.js";

const router = Router();

const translationSchema = z.object({
  text: z.string().trim().min(1).max(10000),
  sourceLanguage: z.string().trim().min(2).max(80),
  targetLanguage: z.string().trim().min(2).max(80),
});

router.post("/", async (req, res) => {
  const parsed = translationSchema.safeParse(req.body);

  if (!parsed.success) {
    res.status(400).json({
      success: false,
      error: "Invalid request body.",
      details: parsed.error.flatten().fieldErrors,
    });
    return;
  }

  const result = await translateText(parsed.data);
  res.status(200).json({ success: true, data: result });
});

export default router;
