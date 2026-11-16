import { gemini, GEMINI_TEXT_MODEL } from "../../lib/gemini";

export type SuggestedResponse = {
  tone: "natural" | "friendly" | "conversational";
  text: string;
  translation: string;
};

type SuggestionInput = {
  message: string;
  sourceLanguage: string;
  targetLanguage: string;
};

export async function generateSuggestion(
    input: SuggestionInput,
): Promise<SuggestedResponse[]> {
    const prompt = `
        You are a multilingual conversation assistant.

        The other person said:
        "${input.message}"

        Source language: ${input.sourceLanguage}
        User's language: ${input.targetLanguage}

        Generate exactly 3 possible replies.

        1. Natural: a simple, natural response.
        2. Friendly: a warm and friendly response.
        3. Conversational: a response that continues the conversation.

        Rules:
        - Write each reply in the source language.
        - Translate each reply into the user's language.
        - Keep the replies concise.
        - Do not invent personal information about the user.
        - Return valid JSON only.

        Expected format:
        {
        "suggestions": [
            {
            "tone": "natural",
            "text": "Reply in source language",
            "translation": "Translation in target language"
            },
            {
            "tone": "friendly",
            "text": "Reply in source language",
            "translation": "Translation in target language"
            },
            {
            "tone": "conversational",
            "text": "Reply in source language",
            "translation": "Translation in target language"
            }
        ]
        }
    `;

    const result = await gemini.models.generateContent({ model: GEMINI_TEXT_MODEL, contents: prompt})
}