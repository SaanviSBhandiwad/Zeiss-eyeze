# Eyeze

A voice-first eye check for rural patients, with a remote optometrist portal. Built for the ZEISS Vision Care hackathon (Theme 3).
This is the React + Express rebuild of the single-file prototype, which is kept in `prototype/`.

**Status:** core app, database and hosting, voice and languages (English, Hindi, Kannada), phone vision tests, Google Meet booking, the **children's check** and the **WhatsApp bot** are in. Live at https://eyeze.onrender.com (portal: `/optometrist`).

```
client/              React + Vite
  src/patient/       home, consent, interview, phone tests, report, messages, my reports, phone sign-in
  src/patient/child/ children's check: the eye game, camera distance gate, sound effects
  src/portal/        optometrist sign-in, live queue, patient detail, reply, insights
  src/shared/        question tree, results engine, translations, WhatsApp answer mapping (also used by the server)
  src/camera/        front camera + MediaPipe face measurements (distance, PD)
  src/lib/           API, auth, realtime, voice
server/              Node.js + Express
  routes/            auth (demo), profiles, voice, events, meet, whatsapp (bridge from the bot)
  services/          sarvam.js, s3.js, store.js (Supabase or in-memory), auth.js, google.js, whatsapp.js
  scripts/           seed-supabase, create-optometrist, pregenerate-tts
whatsapp/            WhatsApp bot (Twilio + Google speech), its own service, see whatsapp/README.md
supabase/schema.sql  tables, row-level security, realtime
render.yaml          Render blueprint (static site + API + WhatsApp bot)
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
**Demo controls** (guided demo, simulate no internet, engine log, reset) are hidden from normal visitors. Open the app with `?demo=1` (e.g. `https://eyeze.onrender.com/?demo=1`) to show them for that browser tab; `?demo=0` hides them again. **Guided demo** plays Ramappa's whole journey in Kannada hands-free. Keep it for judging in case the venue Wi-Fi or an API fails.

The WhatsApp bot is optional locally: run it from `whatsapp/` (see "WhatsApp bot" below).

`GET /api/config` shows which services are live: `{"mode":"demo","sarvam":false,"storage":"local"}`.

## Phase 3: camera tests (near point, pupil distance, setup)

These use the phone's front camera and MediaPipe Face Landmarker. Everything runs in the browser; camera frames are never uploaded or saved.

**One-time setup**

1. Download the model once and commit it: `client/public/models/face_landmarker.task`
   (https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task, about 4 MB).
   Without it the camera tests show "could not load" and offer to skip.
2. `npm install` in `client/`. `npm run dev` and `npm run build` copy the wasm runtime into `public/mediapipe/` automatically (git-ignored).

**Testing on a phone:** the camera only works over https (or localhost). `http://192.168.x.x:5173` will not work. Use the Render deploy, or `ngrok http 5173`.
Add `?camdebug=1` to the URL to overlay the detected irises and the raw numbers (iris px, distance, PD, head turn, eye openness).

**What each test stores** (agreed `p.tests` shape; a skipped or failed test stores `{}`, never null or 0):

| test | stored | how |
|---|---|---|
| `setup` | `{ pxmm }` | card slider (card's short side, 53.98 mm). Optional camera step coaches to 40 cm and can calibrate the camera at 30 cm |
| `near` | `{ level }` | reading chart, print scaled by `setup.pxmm` |
| `np` | `{ cm, add }` | distance from iris size when the person taps "blurry"; `add` from `nearAddFromCm()` (prototype formula) |
| `pd` | `{ mm }` | iris-centre separation scaled by the iris (11.7 mm). Median of 20 clean frames. Outside 40 to 80 mm = failed |

The camera scale is kept on the device (localStorage `eyeze_camscale_v1`), not in `p.tests`.

**Known limits.** Without the 30 cm calibration, distance is only good to about ±15% (it assumes a 70° field of view). PD is good to about ±3 mm and is a near-viewing PD: the eyes converge on the camera, so it reads about 2 mm below distance PD. It is stored uncorrected, and `computeResult` flags this for the optometrist. Quality gates (head turn 10°, eye openness 0.14, minimum iris 12 px) are starting values: tune them on real phones with `?camdebug=1`.

**Two-phone checklist**

1. Open the Render URL on a phone, run Setup: match a card, reach 40 cm, optionally calibrate with a ruler.
2. Run `np` with a tape measure: tap "blurry" at 30 cm and check the stored `cm`.
3. Run `pd` and compare with a PD ruler or an optician's reading.
4. Deny the camera permission once: each test must show a message and let you skip.
5. Send the report and open it on the laptop portal: the Phone screening table and the flags should show your results.

`npm test` in `client/` runs the unit tests (engine, children's triage, WhatsApp answer mapping, camera geometry). `npm test` in `whatsapp/` runs the bot's scripted conversations.

## Children's check (ages 3–10)

A separate flow from the home screen card **Children's check**. A parent answers 4 short questions (sits close to the TV, squints or tilts the head, an eye turning in or out, glasses in the family), then hands the phone to the child, who plays a game:

| Part | Ages 3–5 | Ages 6–10 |
|---|---|---|
| Hero select + training camp | pick a hero, 2 practice rounds that don't count | same |
| Distance vision | **Egg Island**: tap the egg with the same LEA-style picture (house, circle, apple, hand) | **Chomp Canyon**: swipe food into the open mouth of the Landolt C |
| Amsler grid | **Glitch Grid**: 3-2-1 stare at the dot, then flag wobbly squares | same |
| End | world map between missions, treasure chest and badge | same |

**What stays clinical.** The test card is the same plain black-on-white optotype at the adult `VA_PX` sizes, with the same 4 choices and the same rule (2 correct to go up a level, a miss ends the eye; right eye, then left). It starts at 6/24; a miss before any pass drops to 6/60 and climbs. The Amsler grid is the same 14×14 grid. Results use the adult shape: `va: {R, L}`, `amsler: {R, L}`, plus `distCm` / `distChecked`. Game animations never share the screen with an optotype, and flagging Amsler squares earns no extra coins.

**Distance.** The front camera keeps the child at about 40 cm (iris size, same pipeline as the adult tests). The game pauses while they are too close or too far. Without a camera it asks for "one forearm away" and the report is flagged as not distance-checked.

**Languages and voice.** Every child screen is in English, Hindi and Kannada (`shared/i18n-child.js`: informal for the child, polite for the parent). Drishti speaks each instruction, the distance coaching and the result; the header speaker mutes it. The Hindi and Kannada should be reviewed by a native speaker.

**Triage** (`computeResult`, child branch, picked up from `answers.childAge`): normal acuity is 6/18 or better at 3–5 and 6/12 or better at 6–10 (below = amber); 2 or more lines between the eyes (possible amblyopia), squinting or an eye turn reported by the parent = red; Amsler marks or sitting close to the screen = amber. A normal result suggests no glasses; anything else defers to an in-person exam. The server, the queue and the portal all use these rules, and the portal's test table uses the age norms. The parent can **play the eye game again** from the report (a new report) or change their answers.

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
- `eyeze-whatsapp`, the WhatsApp bot (builds from `whatsapp/`)

The Blueprint auto-syncs: every push to `main` redeploys the services whose files changed. Set the secret environment variables in the Render dashboard. Set `CLIENT_ORIGIN` on the API to the static site's URL, and `VITE_API_URL` on the static site to the API's URL. **Changing an environment variable does not redeploy a service**: press *Manual Deploy → Deploy latest commit* afterwards. Free Render services sleep when idle, so open the API URL a minute before a demo.

## Privacy and security notes

- Health data is sensitive personal data under India's DPDP Act. The consent step stays, and Supabase and S3 both live in Mumbai.
- All API keys live in server environment variables. The browser only ever sees the Supabase anon key, which RLS restricts.
- The STT, TTS and upload endpoints are open (the patient isn't signed in during the interview) but rate-limited per IP. Uploads go only to `voice/<profile-id>/`.
- Demo mode is for local use and judging only. Its reset endpoint is unauthenticated, and audio in `server/.storage` disappears on each Render deploy.
- WhatsApp: the bot's `.env`, Google service-account key and `data/` (chat sessions) are git-ignored and must never be committed; on Render the key is a Secret File. The bridge between the bot and the API uses a shared key (`WHATSAPP_BRIDGE_KEY`, generated by the Blueprint), and Twilio requests are signature-checked (`VALIDATE_TWILIO=true`).

## Where to edit

- `client/src/shared/questions.js`: interview questions. `parent` = which answer it follows up on, `cond` = when it appears.
- `client/src/shared/engine.js`: `computeResult` (dominance, triage, lens suggestion, tips), lens and next-step vocabulary, referral centres.
- `client/src/shared/i18n.js`: English, Hindi and Kannada text (plus `i18n-child.js` for the children's check, `i18n-accounts.js` for My reports, `i18n-whatsapp.js` for the WhatsApp buttons).
- `client/src/shared/seed.js`: mock patients and the guided-demo persona.
- `client/src/patient/child/ChildScreens.jsx`: the children's game (screens, rules, spoken lines).
- `client/src/shared/whatsapp.js`: how WhatsApp bot answers map onto the app's questions.
- `whatsapp/src/questions.js`: the WhatsApp bot's question bank.

## WhatsApp bot

`whatsapp/` is a separate Node service (Twilio WhatsApp + Google speech): patients answer the eye questions by chat
or voice notes in English, Hindi or Kannada (questions only, no phone vision tests).

    WhatsApp → Twilio → eyeze-whatsapp (POST /whatsapp) → chat finishes
      → POST /api/integrations/whatsapp on eyeze-api → answers mapped to the app's questions → same triage
      → report in the optometrist queue, tagged "WhatsApp"
    Optometrist replies in the portal → eyeze-api → eyeze-whatsapp → WhatsApp text + voice note

The app shows **Chat on WhatsApp** (header icon, under the Start button, and on the home screen) once `WHATSAPP_NUMBER`
is set on the API. With the Twilio sandbox, the first message is pre-filled with `join <code>`.

**Setup on Render** (after the Blueprint has created `eyeze-whatsapp`):

| Service | Set |
|---|---|
| `eyeze-whatsapp` | `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_WHATSAPP_FROM` (`whatsapp:+14155238886` for the sandbox), `EYEZE_API_URL` (`https://eyeze-api.onrender.com`). Secret File `google-credentials.json` (Google service-account key for speech). |
| `eyeze-api` | `WHATSAPP_BOT_URL` (`https://eyeze-whatsapp.onrender.com`), `WHATSAPP_NUMBER` (`+14155238886` for the sandbox), `WHATSAPP_JOIN_CODE` (the two words after "join" on the Twilio sandbox page) |
| both | `WHATSAPP_BRIDGE_KEY` is generated and shared by the Blueprint |

Then redeploy both services, and in the Twilio console (Messaging → Try it out → Send a WhatsApp message → Sandbox
settings) set "When a message comes in" to `https://eyeze-whatsapp.onrender.com/whatsapp`, method POST.

**Limits.** WhatsApp only allows free-form messages within 24 hours of the patient's last message, so a later portal
reply fails (the portal shows a warning); production needs an approved message template and a Meta-approved number.
The sandbox only answers numbers that have sent the join message. On Render's free plan the bot forgets chats in
progress when it redeploys; finished reports are safe in Eyeze. Full bot docs: `whatsapp/README.md`.
