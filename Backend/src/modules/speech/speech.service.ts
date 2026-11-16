import { gemini, GEMINI_TEXT_MODEL } from "../../lib/gemini.js";
import type { TranscriptionInput, TranscriptionResult } from "./speech.types.js";

export async function transcribeAudio(input: TranscriptionInput): Promise<TranscriptionResult> {
  const audioBase64 = input.audioBase64.replace(/^data:[^,]+,/, "");

  if (!audioBase64 || audioBase64.length > 12_000_000) {
    throw new Error("Audio payload is empty or exceeds the 9 MB limit.");
  }

  if (!/^[A-Za-z0-9+/]+={0,2}$/.test(audioBase64)) {
    throw new Error("Audio payload must be valid base64.");
  }

  const response = await gemini.models.generateContent({
    model: GEMINI_TEXT_MODEL,
    contents: [{
      role: "user",
      parts: [
        {
          text: [
            "Transcribe the attached audio accurately.",
            "Do not summarize, translate, or add commentary.",
            "Preserve the speaker's original words and punctuation.",
            input.language ? `Expected language: ${input.language}` : "Identify the spoken language.",
          ].join("\n"),
        },
        { inlineData: { mimeType: input.mimeType, data: audioBase64 } },
      ],
    }],
    config: { temperature: 0 },
  });

  const transcript = response.text?.trim();

  if (!transcript) throw new Error("The speech recognition provider returned no transcript.");

  return {
    transcript,
    language: input.language ?? null,
  };
}
