import { gemini, GEMINI_LIVE_MODEL } from "../../lib/gemini.js";
import { Modality } from "@google/genai";
import { AppError } from "../../lib/errors.js";
import type { SpeechTranscriptionEvent } from "./speech.types.js";

export type LiveSpeechSession = {
  sendAudio: (base64Pcm: string) => void;
  endAudio: () => void;
  close: () => void;
};

export async function createLiveSpeechSession(
  onEvent: (event: SpeechTranscriptionEvent) => void
): Promise<LiveSpeechSession> {
  try {
    const session = await gemini.live.connect({
      model: GEMINI_LIVE_MODEL,
      config: {
        responseModalities: [Modality.TEXT],
        inputAudioTranscription: {}
      },
      callbacks: {
        onmessage: (message: any) => {
          const content = message.serverContent;
          const partial = content?.interimInputTranscription?.text;
          const finalText = content?.inputTranscription?.text;

          if (typeof partial === "string" && partial.trim()) {
            onEvent({ type: "transcript.partial", text: partial });
          }
          if (typeof finalText === "string" && finalText.trim()) {
            onEvent({ type: "transcript.final", text: finalText.trim() });
          }
        },
        onerror: (event: any) => {
          onEvent({ type: "speech.error", message: event?.message ?? "Gemini Live connection failed." });
        },
        onclose: (event: any) => {
          if (event?.code && event.code !== 1000) {
            onEvent({
              type: "speech.error",
              message: event.reason || "Gemini Live session closed unexpectedly."
            });
          }
        }
      }
    });

    return {
      sendAudio(base64Pcm: string) {
        session.sendRealtimeInput({
          audio: { data: base64Pcm, mimeType: "audio/pcm;rate=16000" }
        });
      },
      endAudio() {
        session.sendRealtimeInput({ audioStreamEnd: true });
      },
      close() {
        session.close();
      }
    };
  } catch (error) {
    console.error("Unable to open Gemini Live session:", error);
    throw new AppError("Unable to start live speech recognition.", 502, "LIVE_SPEECH_UNAVAILABLE");
  }
}
