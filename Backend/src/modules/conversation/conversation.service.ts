import { Prisma } from "@prisma/client";
import { prisma } from "../../lib/prisma.js";
import { AppError } from "../../lib/errors.js";
import { buildConversationContext } from "../ai/context.service.js";
import { translateAndSuggest } from "../translation/translation.service.js";

export async function createConversation(input: { sourceLanguage?: string; targetLanguage: string }) {
  return prisma.conversation.create({
    data: {
      sourceLanguage: input.sourceLanguage ?? "auto",
      targetLanguage: input.targetLanguage
    },
    select: { id: true, sourceLanguage: true, targetLanguage: true, createdAt: true }
  });
}

export async function getConversation(id: string) {
  const conversation = await prisma.conversation.findUnique({
    where: { id },
    include: { messages: { orderBy: { createdAt: "asc" }, take: 100 } }
  });
  if (!conversation) throw new AppError("Conversation not found.", 404, "CONVERSATION_NOT_FOUND");
  return conversation;
}

export async function processConversationTurn(input: {
  conversationId: string;
  text: string;
  sourceLanguage?: string;
}) {
  const conversation = await prisma.conversation.findUnique({ where: { id: input.conversationId } });
  if (!conversation) throw new AppError("Conversation not found.", 404, "CONVERSATION_NOT_FOUND");

  const recentMessages = await prisma.conversationMessage.findMany({
    where: { conversationId: conversation.id },
    orderBy: { createdAt: "desc" },
    take: 8
  });

  const generated = await translateAndSuggest({
    text: input.text,
    sourceLanguage: input.sourceLanguage ?? conversation.sourceLanguage,
    targetLanguage: conversation.targetLanguage,
    context: buildConversationContext(recentMessages)
  });

  const message = await prisma.conversationMessage.create({
    data: {
      conversationId: conversation.id,
      originalText: input.text,
      translatedText: generated.translatedText,
      detectedLanguage: generated.detectedLanguage,
      suggestions: generated.suggestions as Prisma.InputJsonValue
    }
  });

  return {
    message: {
      id: message.id,
      originalText: message.originalText,
      translatedText: message.translatedText,
      detectedLanguage: message.detectedLanguage,
      createdAt: message.createdAt
    },
    suggestions: generated.suggestions
  };
}
