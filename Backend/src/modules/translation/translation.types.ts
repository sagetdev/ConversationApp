export type TranslationRequest = {
  text: string;
  sourceLanguage?: string;
  targetLanguage: string;
};

export type TranslationResult = {
  originalText: string;
  translatedText: string;
  detectedLanguage: string;
};
