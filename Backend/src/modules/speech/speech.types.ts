export const SUPPORTED_AUDIO_MIME_TYPES = [
  "audio/webm",
  "audio/wav",
  "audio/mpeg",
  "audio/mp3",
  "audio/mp4",
  "audio/ogg",
] as const;

export type SupportedAudioMimeType = (typeof SUPPORTED_AUDIO_MIME_TYPES)[number];

export type TranscriptionInput = {
  audioBase64: string;
  mimeType: SupportedAudioMimeType;
  language?: string;
};

export type TranscriptionResult = {
  transcript: string;
  language: string | null;
};
