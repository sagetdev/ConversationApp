export const SUPPORTED_TTS_VOICES = [
  "Achernar", "Achird", "Algenib", "Algieba", "Alnilam", "Aoede",
  "Autonoe", "Callirrhoe", "Charon", "Despina", "Enceladus",
  "Erinome", "Fenrir", "Gacrux", "Iapetus", "Kore", "Laomedeia",
  "Leda", "Orus", "Puck", "Pulcherrima", "Rasalgethi",
  "Sadachbia", "Sadaltager", "Schedar", "Sulafat", "Umbriel",
  "Vindemiatrix", "Zephyr", "Zubenelgenubi",
] as const;

export type SupportedTtsVoice = (typeof SUPPORTED_TTS_VOICES)[number];

export type TextToSpeechInput = {
  text: string;
  languageCode?: string;
  voice?: SupportedTtsVoice;
};

export type TextToSpeechResult = {
  audioBase64: string;
  mimeType: "audio/wav";
  sampleRate: 24000;
  voice: SupportedTtsVoice;
};
