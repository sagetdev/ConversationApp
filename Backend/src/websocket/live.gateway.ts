import type { Server } from "node:http";
import { URL } from "node:url";
import { WebSocket, WebSocketServer } from "ws";
import { z } from "zod";
import { env, allowedOrigins } from "../config/env.js";
import { prisma } from "../lib/prisma.js";
import { createLiveSpeechSession } from "../modules/speech/speech.service.js";
import { processConversationTurn } from "../modules/conversation/conversation.service.js";

const clientMessageSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("audio.chunk"),
    audioBase64: z.string().min(4).max(90_000).regex(/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/)
  }),
  z.object({ type: z.literal("audio.end") }),
  z.object({ type: z.literal("ping") })
]);

type ClientMessage = z.infer<typeof clientMessageSchema>;

function sendJson(socket: WebSocket, payload: Record<string, unknown>): void {
  if (socket.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify(payload));
  }
}

function closeLiveSession(session: Awaited<ReturnType<typeof createLiveSpeechSession>> | undefined): void {
  if (!session) return;
  try {
    session.close();
  } catch (error) {
    console.warn("Unable to close Gemini Live session cleanly:", error);
  }
}

export function attachLiveGateway(server: Server): void {
  const wss = new WebSocketServer({
    noServer: true,
    maxPayload: 128 * 1024,
    perMessageDeflate: false
  });
  const connectionsByIp = new Map<string, number>();

  const handleConnection = (socket: WebSocket, ip: string, conversationId: string | null): void => {
    let closed = false;
    let audioEnded = false;
    let connectionReleased = false;
    let liveSession: Awaited<ReturnType<typeof createLiveSpeechSession>> | undefined;
    let lastFinalTranscript = "";
    let lastFinalAt = 0;
    let turnQueue: Promise<void> = Promise.resolve();

    const releaseConnection = () => {
      if (connectionReleased) return;
      connectionReleased = true;
      const count = connectionsByIp.get(ip) ?? 1;
      if (count <= 1) connectionsByIp.delete(ip);
      else connectionsByIp.set(ip, count - 1);
    };

    socket.once("close", () => {
      closed = true;
      releaseConnection();
      closeLiveSession(liveSession);
    });

    void (async () => {
      if (!conversationId) {
        sendJson(socket, {
          type: "error",
          code: "CONVERSATION_ID_REQUIRED",
          message: "conversationId is required."
        });
        socket.close(1008, "conversationId is required");
        return;
      }

      const conversation = await prisma.conversation.findUnique({
        where: { id: conversationId },
        select: { id: true }
      });

      if (!conversation) {
        sendJson(socket, {
          type: "error",
          code: "CONVERSATION_NOT_FOUND",
          message: "Conversation not found."
        });
        socket.close(1008, "Conversation not found");
        return;
      }

      liveSession = await createLiveSpeechSession((event) => {
        if (closed) return;

        if (event.type === "transcript.partial") {
          sendJson(socket, { type: event.type, text: event.text });
          return;
        }

        if (event.type === "speech.error") {
          sendJson(socket, { type: event.type, message: event.message });
          return;
        }

        const now = Date.now();
        if (event.text === lastFinalTranscript && now - lastFinalAt < 1500) return;
        lastFinalTranscript = event.text;
        lastFinalAt = now;

        sendJson(socket, { type: "transcript.final", text: event.text });
        sendJson(socket, { type: "turn.processing" });

        // Preserve utterance order so concurrent Gemini requests cannot reorder the history.
        turnQueue = turnQueue.then(async () => {
          if (closed) return;
          try {
            const result = await processConversationTurn({ conversationId, text: event.text });
            sendJson(socket, { type: "turn.result", ...result });
          } catch (error) {
            console.error("Unable to process live transcript:", error);
            sendJson(socket, {
              type: "turn.error",
              message: "The transcript was received, but translation or suggestions failed."
            });
          }
        });
      });

      if (closed) {
        closeLiveSession(liveSession);
        return;
      }

      sendJson(socket, {
        type: "session.ready",
        audio: {
          encoding: "PCM_S16LE",
          sampleRate: 16000,
          channels: 1,
          mimeType: "audio/pcm;rate=16000"
        }
      });
    })().catch((error: unknown) => {
      console.error("Live gateway initialization failed:", error);
      sendJson(socket, {
        type: "error",
        code: "LIVE_SESSION_FAILED",
        message: "Unable to start live session."
      });
      socket.close(1011, "Unable to start live session");
    });

    socket.on("message", (raw) => {
      if (!liveSession) {
        sendJson(socket, { type: "error", code: "SESSION_NOT_READY", message: "Live session is not ready." });
        return;
      }

      let parsed: ClientMessage;
      try {
        parsed = clientMessageSchema.parse(JSON.parse(raw.toString()) as unknown);
      } catch {
        sendJson(socket, { type: "error", code: "INVALID_MESSAGE", message: "Invalid WebSocket message." });
        return;
      }

      try {
        switch (parsed.type) {
          case "audio.chunk":
            if (audioEnded) {
              sendJson(socket, { type: "error", code: "AUDIO_STREAM_ENDED", message: "This audio stream has already ended." });
              return;
            }
            liveSession.sendAudio(parsed.audioBase64);
            break;
          case "audio.end":
            if (!audioEnded) {
              audioEnded = true;
              liveSession.endAudio();
            }
            break;
          case "ping":
            sendJson(socket, { type: "pong", timestamp: Date.now() });
            break;
        }
      } catch (error) {
        console.error("Unable to forward client audio to Gemini Live:", error);
        sendJson(socket, {
          type: "speech.error",
          message: "Audio could not be forwarded to the live transcription service."
        });
      }
    });

    socket.on("error", (error) => console.error("Client WebSocket error:", error.message));
  };

  server.on("upgrade", (request, socket, head) => {
    let url: URL;
    try {
      url = new URL(request.url ?? "/", "http://" + (request.headers.host ?? "localhost"));
    } catch {
      socket.destroy();
      return;
    }

    if (url.pathname !== "/ws/live") {
      socket.destroy();
      return;
    }

    const origin = request.headers.origin;
    if (origin && !allowedOrigins.has(origin)) {
      socket.write("HTTP/1.1 403 Forbidden\r\n\r\n");
      socket.destroy();
      return;
    }

    const ip = request.socket.remoteAddress ?? "unknown";
    const current = connectionsByIp.get(ip) ?? 0;
    if (current >= env.WS_MAX_CONNECTIONS_PER_IP) {
      socket.write("HTTP/1.1 429 Too Many Requests\r\n\r\n");
      socket.destroy();
      return;
    }

    connectionsByIp.set(ip, current + 1);
    wss.handleUpgrade(request, socket, head, (websocket) => {
      handleConnection(websocket, ip, url.searchParams.get("conversationId"));
    });
  });
}
