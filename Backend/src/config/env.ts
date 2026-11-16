
import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"])
    .default("development"),

  PORT: z.coerce.number().default(4000),

  OPENAI_API_KEY: z.string().min(1),

  OPENAI_TEXT_MODEL: z.string().default("gpt-6-luna"),

  CORS_ORIGIN: z.string().default(
    "http://localhost:3000,http://localhost:8081"
  ),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("Invalid environment variables:", parsed.error.flatten());
  throw new Error("Environment configuration is invalid.");
}

export const env = parsed.data;
