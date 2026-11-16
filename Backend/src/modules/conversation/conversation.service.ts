import { generateSuggestion } from "../ai/response.service.js";
import { translateText } from "../translation/translation.service.js";
import type { SuggestedResponse } from "../ai/response.service.js";
import type { TranslationResult } from "../translation/translation.types.js";

export type ConversationResult = {
  translation: TranslationResult;
  suggestions: SuggestedResponse[];
};

export async function processConversationMessage(input: {
  message: string;
  sourceLanguage: string;
  targetLanguage: string;
}): Promise<ConversationResult> {
  const [translation, suggestions] = await Promise.all([
    translateText({
      text: input.message,
      sourceLanguage: input.sourceLanguage,
      targetLanguage: input.targetLanguage,
    }),
    generateSuggestion({
      message: input.message,
      sourceLanguage: input.sourceLanguage,
      targetLanguage: input.targetLanguage,
    }),
  ]);

  return { translation, suggestions };
}
