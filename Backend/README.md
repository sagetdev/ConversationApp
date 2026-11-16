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
- `POST /live/token`: issue a short-lived, single-use Gemini Live API token

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

### Live session token request

```json
{
  "sourceLanguage": "English",
  "targetLanguage": "French"
}
```

The Live endpoint returns a one-use ephemeral token. The client uses it to connect directly
to Gemini Live over WebSocket. Send raw 16-bit PCM audio at 16 kHz; Gemini returns audio
at 24 kHz. Input/output transcription events are enabled. The Live session is configured
as a simultaneous interpreter and speaks only the translation.

The endpoint is rate-limited to five token requests per IP per five minutes. Before production,
add user authentication and per-account quotas; IP rate limiting alone is not sufficient.

## Current scope and limitations

The backend currently provides request/response translation, three reply suggestions,
audio transcription, speech synthesis and Live API token provisioning. The frontend must
implement microphone capture, PCM conversion, the direct Gemini Live WebSocket connection,
audio playback, interruption handling and session recovery. Persistent conversation history,
user authentication and database storage are not implemented yet.
