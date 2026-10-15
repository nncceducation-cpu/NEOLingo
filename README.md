# NeoLingo

A voice-first translator with the capabilities of the [NeoLingo website](https://neolingo.calnncc.chatgpt.site/), including the user-selected **Piper Kurmanji voice 54**. This repository runs independently as a Next.js application; a ChatGPT account and Sites hosting are not required for visitors.

## Included capabilities

- Live voice translation with automatic turns and per-turn language detection. Voice is the default mode, but microphone capture starts only when the visitor clicks Start.
- English ↔ detected language conversations, or a fixed target language. Text and recorded-voice translation are also available.
- Separate **Kurdish (Kurmanji)** and **Kurdish (Sorani)** selections, dialect-specific translation guidance, Latin/Arabic script support and automatic text direction.
- Kurmanji speech synthesized on the visitor's device with **atenax/Piper speaker 54**, using the same clarity processing as the auditioned sample. Other languages use OpenAI speech.
- Automatic translation when changing the target language, plus a visible Translate button. Typed input is reused in Text mode. Voice results are translated from the currently displayed translation, because the original recording is discarded.
- End-session handling that flushes the final utterance and waits for its translation and spoken playback. Clear cancels pending work and releases microphone resources.
- Vocabulary hints, General/Medical/Legal/Corporate contexts, close/room microphone filtering, and quiet/clipping feedback.
- Automatic vocal-range matching and masculine/feminine overrides for other languages. Kurmanji deliberately keeps the selected Piper voice 54; pitch is not treated as gender identity.
- Optional back-translations, glossaries, copying, text/audio exports, and a subtle optional soundscape.
- No automatic conversation history, source transcript display, or transcript/audio persistence. Explicit browser-local saves require scope and duration confirmation, expire after 1 or 24 hours, and can be deleted.
- Sanitized provider errors and the text fallback: `Audio unavailable; showing text instead.`

AI translation and speech can make mistakes. This is not certified interpreting or medical/legal advice. Native-speaker review remains necessary for judging pronunciation and translation quality.

## Run locally

Requirements: **Node.js 22.13+** and an OpenAI API project with billing and access to the models listed below.

```sh
npm ci
cp .env.example .env.local
```

On Windows PowerShell, use `Copy-Item .env.example .env.local` instead of `cp`.

Set `OPENAI_API_KEY` in the local `.env.local` file, then:

```sh
npm run dev
```

Open http://127.0.0.1:3000. Keep the key server-side: do not rename it with a `NEXT_PUBLIC_` prefix, commit it, or enter it into the website. The example file contains no credential. No real key or conversation data is included in this repository.

The first Kurmanji playback downloads an approximately **74 MB** immutable public model from Hugging Face, plus browser runtime assets. It may take longer on slower connections/devices. Model files can use the browser's ordinary file cache; this is not conversation storage. Kurmanji synthesis text is processed locally. In two-way mode, the current translated text may be sent to OpenAI to choose the appropriate output language before speech routing.

## Build and run production

```sh
npm run build
npm start
```

The build prepares the Piper runtime automatically; generated binaries are not committed. Serve the app over **HTTPS** for public microphone/WebRTC access. Localhost is supported for development.

The build also emits Next.js standalone output. For a container deployment:

```sh
docker build -t neolingo .
docker run --rm -p 3000:3000 --env-file .env.local neolingo
```

Set `OPENAI_API_KEY` through your host's server environment/secrets settings for a hosted deployment. Configure it separately from GitHub; CI intentionally needs no API key. The container instructions are provided as a deployment option; the Next.js production build and start command are validated separately.

**GitHub Pages cannot run this application:** live translation and speech require server API routes. Use a Node.js-capable host or a container host. Deploying this repository does not change the existing Sites website automatically.

### Models and service boundaries

- `gpt-realtime-2.1`: direct live-audio translation over WebRTC, with source transcription disabled.
- `gpt-4o-transcribe`: recorded-voice recognition with context hints and critical-word uncertainty checks.
- `gpt-4.1`: structured text translation; `store: false`.
- `gpt-4.1-mini`: per-turn language identification/routing; `store: false`.
- `gpt-4o-mini-tts`: non-Kurmanji speech output.
- `atenax/kurmanci-tts-piper`, revision `054099b3aa363625feb30c456a8f98ab27b72dc7`, speaker **54**: local Kurmanji speech, 22.05 kHz, single-threaded workers.

OpenAI availability and billing belong to your API account. This repository does not include API credits or guarantee access to a particular model. Piper requires no additional paid speech provider.

## Validation

```sh
npm test
npm run build
npm run typecheck
```

The offline suite uses synthetic fixtures and mocked provider responses. It covers UI behavior, all listed target-language triggers, privacy controls, source/target routing, session ending, voice-range selection, and local Piper cancellation. It does not charge API credits, record a microphone, or recreate a real conversation. Generated test bundles/results are ignored.

GitHub Actions runs the tests, production build and typecheck on pushes and pull requests. The tests are engineering checks, not an exhaustive linguistic or clinical validation, and do not establish accuracy for every accent or microphone.

## Privacy and operational limits

The application does not add transcript logs, analytics, or a conversation database. Text/audio still goes to OpenAI for translation/recognition, and provider/host retention settings may apply. Configure those services appropriately; app code cannot override their policies.

Explicitly saved translations/audio stay in that browser, with a 1- or 24-hour expiry. They are purged within 30 seconds while the page is open, or on reopening. Exported downloads remain on the visitor's device until deleted. Clearing a session clears unsaved content, not explicitly saved items.

Current limits: 5,000 text characters, 60 seconds per recorded turn, 10 minutes per live session, 15 translation/speech requests per minute, and 4 live starts per minute. Request limits are in-memory per server process. The original Cloudflare client-IP header is recognized; on other hosts requests without that header share the instance's fallback bucket. Configure trusted edge rate limits and cost controls before a large public rollout. Multiple instances need a shared limiter if a global limit is required.

## Source map

- `app/page.tsx`: translator UI, current-result handling, speech and explicit save controls.
- `app/api/translate/route.ts`: recorded recognition, translation, language routing and nonlocal speech.
- `app/api/live/route.ts`: server-side WebRTC SDP proxy; the API key never reaches the client.
- `components/live-voice.tsx` / `lib/live-turns.ts`: live turns, final-phrase flushing and microphone lifecycle.
- `lib/kurmanji-voice.ts` / `lib/kurmanji-clarity.js`: Piper worker integration, selected speaker and clarity filter.
- `scripts/prepare-kurmanji.mjs`: copies pinned dependency runtime assets during dev/build.
- `lib/browser-saves.ts`: opt-in browser audio saves and expiry/deletion.
- `tests/`: deterministic regression checks.

## Credits and licenses

Piper/ONNX/eSpeak and model credits, license texts and upstream source links are in [`public/speech-licenses.txt`](public/speech-licenses.txt) and [`public/voice-licenses`](public/voice-licenses). Preserve these when redistributing the runtime. Speaker 54 is an anonymized learned voice identity, not a claim to imitate a named person.
