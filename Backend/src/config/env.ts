import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  PORT: z.coerce.number().int().min(1).max(65535).default(4000),
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  GEMINI_API_KEY: z.string().min(1, "GEMINI_API_KEY is required"),
  GEMINI_TEXT_MODEL: z.string().default("gemini-3.8-flash"),
  GEMINI_LIVE_MODEL: z.string().default("gemini-3.5-transcribe-live"),
  GEMINI_TTS_MODEL: z.string().default("gemini-3.1-flash-tts-preview"),
  GEMINI_TTS_VOICE: z.string().default("Kore"),
  CORS_ORIGIN: z.string().default("http://localhost:3000,http://localhost:8081"),
  WS_MAX_CONNECTIONS_PER_IP: z.coerce.number().int().min(1).max(20).default(3)
});

const parsed = envSchema.safeParse(process.env);
if (!parsed.success) {
  console.error("Invalid environment variables:", parsed.error.flatten().fieldErrors);
  throw new Error("Environment configuration is invalid.");
}

export const env = parsed.data;
export const allowedOrigins = new Set(
  env.CORS_ORIGIN.split(",").map((origin) => origin.trim()).filter(Boolean)
);
