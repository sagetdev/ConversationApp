import { Modality } from "@google/genai";
import { gemini } from "../lib/gemini.js";

export const GEMINI_LIVE_MODEL = "gemini-3.1-flash-live-preview";

export type LiveTokenInput = {
  sourceLanguage: string;
  targetLanguage: string;
};

export type LiveTokenResult = {
  token: string;
  model: string;
  expiresAt: string;
  sessionStartDeadline: string;
  inputAudioMimeType: "audio/pcm;rate=16000";
  outputAudioSampleRate: 24000;
};

export async function createLiveSessionToken(input: LiveTokenInput): Promise<LiveTokenResult> {
  const now = Date.now();
  const expiresAt = new Date(now + 30 * 60 * 1000);
  const sessionStartDeadline = new Date(now + 60 * 1000);

  const systemInstruction = [
    "You are a real-time simultaneous interpreter.",
    `The speaker is speaking in ${input.sourceLanguage}.`,
    `Translate everything they say into ${input.targetLanguage}.`,
    "Speak only the translation. Do not answer questions, add explanations, or continue the conversation.",
    "Preserve meaning, names, numbers, tone, and intent.",
    "If speech is unclear, ask briefly for repetition in the target language.",
  ].join("\n");

  const token = await gemini.authTokens.create({
    config: {
      uses: 1,
      expireTime: expiresAt.toISOString(),
      newSessionExpireTime: sessionStartDeadline.toISOString(),
      liveConnectConstraints: {
        model: GEMINI_LIVE_MODEL,
        config: {
          responseModalities: [Modality.AUDIO],
          inputAudioTranscription: {},
          outputAudioTranscription: {},
          systemInstruction: {
            parts: [{ text: systemInstruction }],
          },
          sessionResumption: {},
        },
      },
    },
  });

  if (!token.name) {
    throw new Error("Gemini did not return a Live API token.");
  }

  return {
    token: token.name,
    model: GEMINI_LIVE_MODEL,
    expiresAt: expiresAt.toISOString(),
    sessionStartDeadline: sessionStartDeadline.toISOString(),
    inputAudioMimeType: "audio/pcm;rate=16000",
    outputAudioSampleRate: 24000,
  };
}
