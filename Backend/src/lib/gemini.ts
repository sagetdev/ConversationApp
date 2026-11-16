import { GoogleGenAI } from "@google/genai";
import { env } from "../config/env.js";

export const gemini = new GoogleGenAI({ apiKey: env.GEMINI_API_KEY });
export const GEMINI_TEXT_MODEL = env.GEMINI_TEXT_MODEL;
export const GEMINI_LIVE_MODEL = env.GEMINI_LIVE_MODEL;
export const GEMINI_TTS_MODEL = env.GEMINI_TTS_MODEL;
