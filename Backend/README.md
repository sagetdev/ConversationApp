# ConversationApp Backend

Node.js, Express 5, TypeScript and Google Gemini API.

## Requirements

- Node.js 22 or newer
- npm
- A Google Gemini API key

## Setup

```bash
npm install
copy .env.example .env
```

Set `GEMINI_API_KEY` in `.env`, then run:

```bash
npm run dev
```

## Commands

- `npm run dev`: start the development server
- `npm run typecheck`: run TypeScript checks
- `npm run build`: compile to `dist`
- `npm start`: run the compiled server

## API

Base URL: `http://localhost:4000/api/v1`

- `GET /health/`: health check
- `POST /translation`: translate text
- `POST /conversation/suggestions`: generate three suggested replies
- `POST /conversation/process`: translate a message and generate three replies
- `POST /speech/transcribe`: transcribe a base64 audio payload
- `POST /audio/synthesize`: generate WAV speech audio from text

### Translation request

```json
{
  "text": "Where is the nearest train station?",
  "sourceLanguage": "English",
  "targetLanguage": "French"
}
```

### Conversation request

```json
{
  "message": "Would you like to get a coffee?",
  "sourceLanguage": "English",
  "targetLanguage": "French"
}
```

### Speech transcription request

```json
{
  "audioBase64": "BASE64_AUDIO_DATA",
  "mimeType": "audio/webm",
  "language": "English"
}
```

### Text-to-speech request

```json
{
  "text": "Bonjour, comment allez-vous ?",
  "languageCode": "fr-FR",
  "voice": "Kore"
}
```

The speech synthesis endpoint returns base64-encoded mono WAV audio at 24 kHz.

## Current scope and limitations

The backend currently provides request/response translation, three reply suggestions,
audio transcription and speech synthesis. It does not yet provide persistent conversation
history, user authentication, a database, or a bidirectional low-latency live audio/WebSocket
session. Those require additional implementation and integration tests before production use.
