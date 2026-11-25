# DrishtiSetu — WhatsApp adaptive anamnesis bot

Part of the Eyeze repo: a separate service, connected to the Eyeze API so WhatsApp patients land in the same optometrist queue (see "Connection to Eyeze" below).

Node.js + Express + Twilio WhatsApp. Reuses the question bank and scoring rules from the DrishtiSetu web prototype.

## Run it (5 steps)

1. `npm install`
2. `cp .env.example .env` and fill in your Twilio SID, auth token, and an `OPTOMETRIST_API_KEY`
3. Try the bot with no Twilio at all: `npm run chat` (terminal chat) and `npm test` (scripted personas)
4. `npm start`, then in a second terminal `ngrok http 3000`
5. Twilio Console → Messaging → Try it out → Send a WhatsApp message → Sandbox settings:
   - "When a message comes in": `https://<your-ngrok>.ngrok-free.app/whatsapp`, method **POST**
   - From your phone, WhatsApp the sandbox number with `join <your-two-words>`, then send `hi`

## How it works

    WhatsApp → Twilio → ngrok → POST /whatsapp → engine.handle() → TwiML reply → WhatsApp

| File | Job |
|---|---|
| `src/questions.js` | Question bank (EN/HI/KN) with `cond` adaptive rules, ported from the web prototype |
| `src/engine.js` | State machine: language → consent → name → age → adaptive questions → profile |
| `src/scoring.js` | Near/mid/far dominance, triage (green/amber/red), lens suggestion, tips |
| `src/i18n.js` | Bot-owned messages in 3 languages |
| `src/store.js` | JSON-file sessions and completed profiles (swap for a real DB later) |
| `src/server.js` | Twilio webhook + optometrist API |

## Add or change a question

Edit `src/questions.js`. Example of an adaptive follow-up:

    {id:'cataract_q', type:'single',
     cond:(a,age)=>age>=50 && a.difficulty?.includes('far'),
     t:['Do lights look hazy?','...','...'], o:[{v:'yes',l:['Yes','..','..'],kw:['yes']}, ...]}

`cond` receives the answers so far and the age. The engine re-evaluates every question after every answer.

## Optometrist bridge (API)

Header `x-api-key: <OPTOMETRIST_API_KEY>`

- `GET /api/profiles` — completed profiles, newest first
- `POST /api/profiles/:phone/reply` with `{"text":"..."}` — saved and sent to the patient's WhatsApp

## Known limits

- Voice notes: bot asks for a number instead. See "Voice" in the guide to add speech-to-text.
- Sandbox only works for numbers that sent `join ...`; sessions last 24 h. A production number needs Meta business approval.
- This is screening, not diagnosis. Lens output is a suggestion for the optometrist to confirm.

## Connection to Eyeze

    WhatsApp chat finishes → bot POST /api/integrations/whatsapp on eyeze-api (header x-bridge-key)
        → answers mapped to the app's questions (client/src/shared/whatsapp.js) → same triage engine
        → report in the optometrist portal, tagged "WhatsApp"
    Optometrist replies in the portal → eyeze-api → bot POST /api/profiles/:phone/reply → WhatsApp text + voice note

Set on the bot: `EYEZE_API_URL`, `WHATSAPP_BRIDGE_KEY`. Set on eyeze-api: the same `WHATSAPP_BRIDGE_KEY`, plus
`WHATSAPP_BOT_URL` (for replies), `WHATSAPP_NUMBER` and, for the sandbox, `WHATSAPP_JOIN_CODE` (these show the
"Chat on WhatsApp" button in the app). On Render, `render.yaml` shares the key between the two services.

Local test without WhatsApp: run eyeze-api and this bot with the same key, then post messages to the webhook like
Twilio does, e.g. `curl -X POST localhost:3000/whatsapp -d From=whatsapp:+919845012345 -d Body=hi -d NumMedia=0`.

Notes:
- **Secrets:** `.env` and the Google key file are git-ignored. On Render, upload the key as a Secret File.
- **24-hour rule:** WhatsApp only allows free-form messages within 24 h of the patient's last message. A portal
  reply sent later fails (the portal shows the warning). Production needs an approved message template for that.
- **Storage:** sessions live in `data/` (wiped on Render free redeploys). Finished profiles are safe in Eyeze.
