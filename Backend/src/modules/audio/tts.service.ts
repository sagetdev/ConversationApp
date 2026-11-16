import { gemini, GEMINI_TTS_MODEL } from "../../lib/gemini.js";
import { env } from "../../config/env.js";
import { AppError } from "../../lib/errors.js";
import type { GeneratedSpeech } from "./audio.types.js";

export async function synthesizeSpeech(input: { text: string; language: string }): Promise<GeneratedSpeech> {
  try {
    const result = await gemini.models.generateContent({
      model: GEMINI_TTS_MODEL,
      contents: [{
        role: "user",
        parts: [{
          text: "Read the following text naturally in " + input.language +
            ". Do not translate or add words: " + input.text
        }]
      }],
      config: {
        responseModalities: ["AUDIO"],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: env.GEMINI_TTS_VOICE }
          }
        }
      }
    });

    const parts = result.candidates?.[0]?.content?.parts ?? [];
    const audioPart = parts.find((part) => part.inlineData?.data);
    if (!audioPart?.inlineData?.data) {
      throw new AppError("Gemini did not return audio data.", 502, "TTS_EMPTY_RESPONSE");
    }

    return {
      mimeType: audioPart.inlineData.mimeType ?? "audio/pcm",
      audioBase64: audioPart.inlineData.data
    };
  } catch (error) {
    if (error instanceof AppError) throw error;
    console.error("Gemini text-to-speech failed:", error);
    throw new AppError("Speech synthesis is temporarily unavailable.", 502, "TTS_REQUEST_FAILED");
  }
}
