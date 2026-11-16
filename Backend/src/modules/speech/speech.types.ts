export type SpeechTranscriptionEvent =
  | { type: "transcript.partial"; text: string }
  | { type: "transcript.final"; text: string }
  | { type: "speech.error"; message: string };

export type PcmAudioChunk = {
  data: string;
  mimeType: "audio/pcm;rate=16000";
};
