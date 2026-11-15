# Eyeze

A voice-first eye check for rural patients, with a remote optometrist portal. Built for the ZEISS Vision Care hackathon (Theme 3).
This is the React + Express rebuild of the single-file prototype, which is kept in `prototype/`.

**Status:** phases 1 (core app, database, hosting) and 2 (voice and languages) are done. The phone vision tests, Google Meet and WhatsApp come in phases 3 and 4.

```
client/              React + Vite
  src/patient/       home, consent, interview, report, messages, phone sign-in
  src/portal/        optometrist sign-in, live queue, patient detail, reply
  src/shared/        question tree, results engine, translations (also used by the server)
  src/lib/           API, auth, realtime, voice
server/              Node.js + Express
  routes/            auth (demo), profiles, voice, events
  services/          sarvam.js, s3.js, store.js (Supabase or in-memory), auth.js
  scripts/           seed-supabase, create-optometrist, pregenerate-tts
supabase/schema.sql  tables, row-level security, realtime
render.yaml          Render blueprint (static site + web service)
```

## Run it locally (no accounts needed)

Every external service is optional. With no `.env`, the app runs in **demo mode**: mock patients in memory, demo phone OTP shown on screen, the browser's own speech, and audio saved in `server/.storage`.

```bash
cd server && npm install && npm run dev        # API on http://localhost:4000
cd client && npm install && npm run dev        # app on http://localhost:5173
```

- Patient app: http://localhost:5173/
- Optometrist portal: http://localhost:5173/optometrist (demo login is pre-filled)

Open both in two tabs. Send a report from the patient app and it appears in the portal instantly; the reply appears back in the patient app.
In the patient app, **Demo controls → Guided demo** plays Ramappa's whole journey in Kannada hands-free. Keep this mode for judging in case the venue Wi-Fi or an API fails.

`GET /api/config` shows which services are live: `{"mode":"demo","sarvam":false,"storage":"local"}`.

## Phase 1: Supabase

1. Create a Supabase project in **Mumbai (ap-south-1)**.
2. SQL editor → run `supabase/schema.sql` (tables, row-level security, realtime publication).
3. Authentication → Providers → **Phone**: enable it and connect an SMS provider (Twilio, MessageBird or Vonage). Supabase can't send real OTPs without one. For testing you can add test phone numbers with fixed codes in the same screen.
4. Fill in `server/.env` (copy `server/.env.example`): `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`.
5. Create an optometrist and load the mock patients:
   ```bash
   cd server
   npm run create-optometrist -- doctor@example.com "a-strong-password" "Dr. Anjali Rao"
   npm run seed
   ```

The browser gets the Supabase URL and anon key from `/api/config`, so the client needs no Supabase settings. The service-role key stays on the server.

**How data flows:** the browser signs in with Supabase Auth (phone OTP for patients, email and password for optometrists) and sends its access token to Express. Express checks the token and the role, recomputes triage with the shared engine (it never trusts the client's triage), and writes to Postgres. Supabase Realtime tells both apps when something changes, and they refetch. Row-level security means a patient can only see their own reports, even through Realtime.

## Phase 2: Sarvam AI and S3

Add `SARVAM_API_KEY` to `server/.env`. Without it the app falls back to the browser's speech features.

| Feature | How |
|---|---|
| Questions spoken | `POST /api/voice/tts` → Sarvam `bulbul:v3`. Cached in storage by text hash, so each question is generated once per language. Run `npm run pregenerate-tts` (with the server running) to warm the cache. |
| Answers by voice | The browser records with MediaRecorder, stops by itself after a pause, and converts to 16 kHz WAV. `POST /api/voice/stt` runs Sarvam `saaras:v3` twice in parallel: `transcribe` (Kannada/Hindi text) and `translate` (English). The shared `matchAnswer()` checks both against the options. |
| Patient's free-text note | Translated to English when the report is submitted, for the portal. |
| Optometrist's note | Translated into the patient's language with `mayura:v1`. The whole reply is then spoken with TTS and saved as a voice message. |
| Voice answers kept | Uploaded straight from the browser to S3 with a presigned POST (3 MB limit, audio only). The optometrist plays them through short-lived signed URLs. |

Model names are in `.env` (`SARVAM_STT_MODEL`, `SARVAM_TTS_MODEL`, `SARVAM_TTS_SPEAKER`, `SARVAM_TRANSLATE_MODEL`) because Sarvam updates them often. They were checked against docs.sarvam.ai in November 2026. Rate limits on the pay-as-you-go plan are 60 requests a minute for each API.

**S3 setup:** create a private bucket in `ap-south-1` and set `S3_BUCKET`, `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY`. Give the IAM user only `s3:PutObject`, `s3:GetObject` and `s3:ListBucket` on that bucket. Add a CORS rule so browsers can upload and play audio:

```json
[{ "AllowedOrigins": ["https://your-site.onrender.com", "http://localhost:5173"],
   "AllowedMethods": ["POST", "GET"], "AllowedHeaders": ["*"], "MaxAgeSeconds": 3000 }]
```

## Deploy on Render

Push this folder as its own Git repository, then in Render choose **New → Blueprint** and pick the repo. `render.yaml` creates:
- `eyeze-api`, a web service that builds from the repo root because it imports `client/src/shared`
- `eyeze`, a static site with a rewrite so `/optometrist` works on refresh

Set the secret environment variables in the Render dashboard. Set `CLIENT_ORIGIN` on the API to the static site's URL, and `VITE_API_URL` on the static site to the API's URL. Free Render services sleep when idle, so open the API URL a minute before a demo.

## Privacy and security notes

- Health data is sensitive personal data under India's DPDP Act. The consent step stays, and Supabase and S3 both live in Mumbai.
- All API keys live in server environment variables. The browser only ever sees the Supabase anon key, which RLS restricts.
- The STT, TTS and upload endpoints are open (the patient isn't signed in during the interview) but rate-limited per IP. Uploads go only to `voice/<profile-id>/`.
- Demo mode is for local use and judging only. Its reset endpoint is unauthenticated, and audio in `server/.storage` disappears on each Render deploy.

## Where to edit

- `client/src/shared/questions.js`: interview questions. `parent` = which answer it follows up on, `cond` = when it appears.
- `client/src/shared/engine.js`: `computeResult` (dominance, triage, lens suggestion, tips), lens and next-step vocabulary, referral centres.
- `client/src/shared/i18n.js`: all English, Hindi and Kannada text.
- `client/src/shared/seed.js`: mock patients and the guided-demo persona.
