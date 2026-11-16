import { gemini, GEMINI_TEXT_MODEL } from "../../lib/gemini.js";
import type { TranslationInput, TranslationResult } from "./translation.types.js";

export async function translateText(input: TranslationInput): Promise<TranslationResult> {
  const text = input.text.trim();

  if (!text) throw new Error("Text to translate cannot be empty.");
  if (text.length > 10000) throw new Error("Text to translate cannot exceed 10000 characters.");

  const response = await gemini.models.generateContent({
    model: GEMINI_TEXT_MODEL,
    contents: [
      "Translate the text below accurately and naturally.",
      "Preserve its meaning, tone, register, names, numbers, and formatting.",
      "Return only the translation, without explanations or quotation marks.",
      `Source language: ${input.sourceLanguage}`,
      `Target language: ${input.targetLanguage}`,
      `Text: ${JSON.stringify(text)}`,
    ].join("\n"),
    config: { temperature: 0.2 },
  });

  const translatedText = response.text?.trim();

  if (!translatedText) throw new Error("The AI provider returned an empty translation.");

  return {
    originalText: text,
    translatedText,
    sourceLanguage: input.sourceLanguage,
    targetLanguage: input.targetLanguage,
  };
}
