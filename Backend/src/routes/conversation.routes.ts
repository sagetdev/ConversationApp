import { Router } from "express";
import { z } from "zod";
import { processConversationMessage } from "../modules/conversation/conversation.service.js";
import { generateSuggestion } from "../modules/ai/response.service.js";

const router = Router();

const conversationSchema = z.object({
  message: z.string().trim().min(1).max(5000),
  sourceLanguage: z.string().trim().min(2).max(80),
  targetLanguage: z.string().trim().min(2).max(80),
});

router.post("/process", async (req, res) => {
  const parsed = conversationSchema.safeParse(req.body);

  if (!parsed.success) {
    res.status(400).json({
      success: false,
      error: "Invalid request body.",
      details: parsed.error.flatten().fieldErrors,
    });
    return;
  }

  const result = await processConversationMessage(parsed.data);
  res.status(200).json({ success: true, data: result });
});

router.post("/suggestions", async (req, res) => {
  const parsed = conversationSchema.safeParse(req.body);

  if (!parsed.success) {
    res.status(400).json({
      success: false,
      error: "Invalid request body.",
      details: parsed.error.flatten().fieldErrors,
    });
    return;
  }

  const suggestions = await generateSuggestion(parsed.data);
  res.status(200).json({ success: true, data: { suggestions } });
});

export default router;
