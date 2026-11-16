import type { ConversationMessage } from "@prisma/client";

export type ConversationContextItem = {
  role: "interlocutor" | "assistant";
  text: string;
  translation?: string | null;
};

export function buildConversationContext(messages: ConversationMessage[]): ConversationContextItem[] {
  return [...messages].reverse().map((message) => ({
    role: message.role === "ASSISTANT" ? "assistant" : "interlocutor",
    text: message.originalText,
    translation: message.translatedText
  }));
}
