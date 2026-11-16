import { Router } from "express";
import { z } from "zod";
import { asyncHandler } from "../lib/async-handler.js";
import { sendSuccess } from "../lib/api-response.js";
import {
  createConversation,
  getConversation,
  processConversationTurn
} from "../modules/conversation/conversation.service.js";

const router = Router();

const createSchema = z.object({
  sourceLanguage: z.string().min(2).max(40).optional().default("auto"),
  targetLanguage: z.string().min(2).max(40)
});

const turnSchema = z.object({
  text: z.string().trim().min(1).max(4000),
  sourceLanguage: z.string().min(2).max(40).optional()
});

const conversationIdSchema = z.string().min(1).max(128);

router.post("/", asyncHandler(async (req, res) => {
  const input = createSchema.parse(req.body);
  const conversation = await createConversation(input);
  sendSuccess(res, conversation, 201);
}));

router.get("/:conversationId", asyncHandler(async (req, res) => {
  const conversationId = conversationIdSchema.parse(req.params.conversationId);
  const conversation = await getConversation(conversationId);
  sendSuccess(res, conversation);
}));

router.post("/:conversationId/turns", asyncHandler(async (req, res) => {
  const conversationId = conversationIdSchema.parse(req.params.conversationId);
  const input = turnSchema.parse(req.body);
  const result = await processConversationTurn({
    conversationId,
    text: input.text,
    sourceLanguage: input.sourceLanguage
  });
  sendSuccess(res, result, 201);
}));

export default router;
