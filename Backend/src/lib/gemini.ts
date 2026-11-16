
import { GoogleGenAI } from "@google/genai";

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  throw new Error("GEMINI_API_KEY is missing from environment variables.");
}

export const gemini = new GoogleGenAI({
  apiKey,
});

export const GEMINI_TEXT_MODEL =
  process.env.GEMINI_TEXT_MODEL || "gemini-3.8-flash";
