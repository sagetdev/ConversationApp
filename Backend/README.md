# ConversationApp Backend

Express + TypeScript backend for real-time multilingual conversations, powered by Google Gemini.

## Features

- Gemini Live streaming speech-to-text over WebSocket.
- Automatic source-language detection through transcription and translation.
- Translation into the conversation target language.
- Exactly three contextual reply suggestions: natural, friendly and conversational.
- Gemini text-to-speech endpoint.
- PostgreSQL persistence with Prisma.
- Request validation, rate limiting, Helmet, CORS allowlist, WebSocket origin checks and connection caps.
- Authentication intentionally omitted for this iteration.

## Requirements

- Node.js 22.12 or newer.
- PostgreSQL 14 or newer.
- A Google AI Studio Gemini API key with access to the configured models.

## Setup

1. Copy .env.example to .env.
2. Set DATABASE_URL and GEMINI_API_KEY.
3. Install dependencies with npm install.
4. Generate Prisma Client: npm run db:generate.
5. Apply database migrations: npm run db:deploy.
6. Start the development server: npm run dev.

Build and run:

~~~bash
npm run build
npm start
~~~

## HTTP API

Base path: /api/v1

- GET /health checks PostgreSQL connectivity and Gemini configuration.
- POST /conversations creates a conversation. Body: {"sourceLanguage":"auto","targetLanguage":"fr"}.
- GET /conversations/:conversationId returns a conversation and up to 100 messages.
- POST /conversations/:conversationId/turns processes typed text. Body: {"text":"Hey, how are you?","sourceLanguage":"en"}.
- POST /audio/speech generates speech. Body: {"text":"Bonjour","language":"French"}.

## Live speech WebSocket

Connect to:

ws://localhost:4000/ws/live?conversationId=YOUR_CONVERSATION_ID

The client must capture mono PCM signed 16-bit little-endian audio at 16 kHz. Send short chunks (ideally 20–100 ms):

~~~json
{"type":"audio.chunk","audioBase64":"BASE64_PCM_BYTES"}
~~~

End an audio stream with:

~~~json
{"type":"audio.end"}
~~~

Server events:

- session.ready: session established and audio format requirements.
- transcript.partial: interim transcription while the speaker is talking.
- transcript.final: final transcription for an utterance.
- turn.processing: translation and reply generation started.
- turn.result: persisted translated message and three suggestions.
- turn.error, speech.error or error: errors.

Do not send microphone audio before session.ready.

## Production notes

- Authentication and ownership checks are intentionally omitted for this iteration. Do not expose this API publicly until authentication, authorization and conversation ownership are added.
- Use HTTPS/WSS in deployed environments and restrict CORS_ORIGIN to exact frontend origins.
- Configure database backups, connection pooling, monitoring and secret management.
- Gemini Live connections are time-limited. Add session resumption and reconnect handling before long-running production calls.
- Resample client audio to PCM 16 kHz mono and keep chunks short.
- Configure Google AI billing, quotas and model availability for the selected Google project.
- The server proxies audio to Gemini, keeping the permanent API key off client devices. This uses backend bandwidth and concurrent server connections.
