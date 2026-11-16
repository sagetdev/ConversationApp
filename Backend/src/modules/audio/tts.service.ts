import { Modality } from "@google/genai";
import { gemini } from "../../lib/gemini.js";
import type { TextToSpeechInput, TextToSpeechResult } from "./audio.types.js";

const TTS_MODEL = "gemini-3.1-flash-tts-preview";
const DEFAULT_VOICE = "Kore";

function pcmToWav(pcm: Buffer, sampleRate: number): Buffer {
  const header = Buffer.alloc(44);
  const byteRate = sampleRate * 2;

  header.write("RIFF", 0);
  header.writeUInt32LE(36 + pcm.length, 4);
  header.write("WAVE", 8);
  header.write("fmt ", 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20);
  header.writeUInt16LE(1, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(byteRate, 28);
  header.writeUInt16LE(2, 32);
  header.writeUInt16LE(16, 34);
  header.write("data", 36);
  header.writeUInt32LE(pcm.length, 40);

  return Buffer.concat([header, pcm]);
}

export async function synthesizeSpeech(input: TextToSpeechInput): Promise<TextToSpeechResult> {
  const text = input.text.trim();

  if (!text) throw new Error("Text to synthesize cannot be empty.");
  if (text.length > 3000) throw new Error("Text to synthesize cannot exceed 3000 characters.");

  const voice = input.voice ?? DEFAULT_VOICE;

  const response = await gemini.models.generateContent({
    model: TTS_MODEL,
    contents: text,
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName: voice },
        },
        ...(input.languageCode ? { languageCode: input.languageCode } : {}),
      },
    },
  });

  const audioData = response.candidates
    ?.flatMap((candidate) => candidate.content?.parts ?? [])
    .find((part) => part.inlineData?.data)?.inlineData?.data;

  if (!audioData) throw new Error("The text-to-speech provider returned no audio.");

  const pcm = Buffer.from(audioData, "base64");
  if (pcm.length === 0) throw new Error("The text-to-speech provider returned empty audio.");

  return {
    audioBase64: pcmToWav(pcm, 24000).toString("base64"),
    mimeType: "audio/wav",
    sampleRate: 24000,
    voice,
  };
}
