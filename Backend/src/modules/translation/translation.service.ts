import { generateConversationTurn, type GeneratedConversationTurn } from "../ai/response.service.js";
import type { ConversationContextItem } from "../ai/context.service.js";

export async function translateAndSuggest(input: {
  text: string;
  sourceLanguage: string;
  targetLanguage: string;
  context: ConversationContextItem[];
}): Promise<GeneratedConversationTurn> {
  return generateConversationTurn({
    message: input.text,
    sourceLanguage: input.sourceLanguage,
    targetLanguage: input.targetLanguage,
    context: input.context
  });
}
