require('dotenv').config();
const express = require('express');
const twilio = require('twilio');
const axios = require('axios');
const { newSession, handle } = require('./engine');
const store = require('./store');
const { speak, withTimeout, AUDIO_DIR } = require('./tts');
const { M } = require('./i18n');
const { transcribe } = require('./stt');
const { QMAP } = require('./questions');
const bridge = require('./bridge');

const { SpeechClient } = require('@google-cloud/speech');
const speechClient = new SpeechClient();


async function transcribeAudio(mediaUrl, contentType, languageCode, phrases = []) {
  const response = await axios.get(mediaUrl, {
    responseType: 'arraybuffer',
    auth: {
      username: process.env.TWILIO_ACCOUNT_SID,
      password: process.env.TWILIO_AUTH_TOKEN
    },
    timeout: 30000
  });

  const audioBuffer = Buffer.from(response.data);

  console.log('WhatsApp audio content type:', contentType);
  console.log('Downloaded audio bytes:', audioBuffer.length);

  // stt.js tries several settings and logs exactly what Google answered
  return transcribe(speechClient, audioBuffer, contentType, languageCode, phrases);
}

const app = express();
app.use(express.urlencoded({ extended: false })); // Twilio posts form-encoded, not JSON
app.use(express.json());

const client = process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN
  ? twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN) : null;

// Twilio fetches the MP3s from here (through ngrok), so they must be public.
app.use('/audio', express.static(AUDIO_DIR, { maxAge: '7d' }));
// Public base URL, taken from the request itself so you never have to edit .env when ngrok changes.
const baseUrl = req => `${req.get('x-forwarded-proto') || req.protocol}://${req.get('x-forwarded-host') || req.get('host')}`;
const HINTS = new Set(M.hint);

app.get('/', (_, res) => res.send('DrishtiSetu WhatsApp bot is running ✅'));

// ---------- 1. WhatsApp webhook (Twilio calls this for every incoming message) ----------
app.post('/whatsapp', async (req, res) => {
  try {
    if (process.env.VALIDATE_TWILIO === 'true') {
      // Twilio signs the exact URL it called. PUBLIC_URL overrides; otherwise use the forwarded host (Render, ngrok).
      const url = (process.env.PUBLIC_URL || baseUrl(req)).replace(/\/$/, '') + req.originalUrl;
      const ok = twilio.validateRequest(
        process.env.TWILIO_AUTH_TOKEN,
        req.header('X-Twilio-Signature') || '',
        url,
        req.body
      );

      if (!ok) return res.status(403).send('Invalid signature');
    }

    const phone = req.body.From;
    const incomingText = (req.body.Body || '').trim();
    const mediaCount = parseInt(req.body.NumMedia || '0', 10);
    const contentType = req.body.MediaContentType0 || '';
    const hasAudio = mediaCount > 0 && /^audio\//i.test(contentType);

    const session = store.getSession(phone) || newSession();
    let text = incomingText;
    if (hasAudio && session.step !== 'lang') session.voice = true;

    if (hasAudio) {
      if (
        !process.env.TWILIO_ACCOUNT_SID ||
        !process.env.TWILIO_AUTH_TOKEN ||
        !req.body.MediaUrl0
      ) {
        const twiml = new twilio.twiml.MessagingResponse();
        twiml.message(
          'Sorry, I could not access your voice note. Please try again or type your answer.'
        );
        return res.type('text/xml').send(twiml.toString());
      }

      const languageCodes = {
        0: 'en-IN',
        1: 'hi-IN',
        2: 'kn-IN'
      };

      try {
        // Tell Google what answers to expect: the current question's options + the numbers
        const q = session.step === 'q' ? QMAP[session.current] : null;
        const phrases = q
          ? [...q.o.flatMap(o => [...(o.kw || []), o.l[session.lang] || o.l[0]]), '1', '2', '3', '4', '5', '6', '7']
          : session.step === 'lang' ? ['English', 'Hindi', 'Kannada'] : [];
        text = await transcribeAudio(
          req.body.MediaUrl0,
          contentType,
          languageCodes[session.lang] || 'en-IN',
          phrases
        );
      } catch (error) {
        console.error('Voice transcription failed:', error.message);
        text = '';
      }

      if (!text) {
        const twiml = new twilio.twiml.MessagingResponse();
        twiml.message(
          'I could not understand that voice note. Please speak clearly and try again, or type your answer.'
        );
        return res.type('text/xml').send(twiml.toString());
      }
      
      console.log('Transcribed voice text:', JSON.stringify(text));
      console.log('Voice note transcribed successfully.');
    }

    const wasDone = session.done;
    const { s, replies } = handle(session, text, { hasAudio });

    store.saveSession(phone, s);

    if (s.done && !wasDone) {
      store.saveProfile(phone, s);
      // Send it to the Eyeze optometrist queue in the background; the patient's reply isn't held up by it.
      bridge.pushProfile(phone, s).then(id => id && store.setEyezeId(phone, id)).catch(() => {});
    }

    // Build the reply: every text message, plus a spoken copy if voice is on.
    const speakNow = s.voice && s.step !== 'lang';
    const audio = await Promise.all(replies.map(async r => {
      if (!speakNow || HINTS.has(r)) return null;
      try { return await withTimeout(speak(r, s.lang), 8000); }
      catch (e) { console.error('TTS failed (sending text only):', e.message); return null; }
    }));

    const twiml = new twilio.twiml.MessagingResponse();
    replies.forEach((reply, i) => {
      twiml.message(reply);
      if (audio[i]) twiml.message().media(`${baseUrl(req)}/audio/${audio[i]}`);
    });

    res.type('text/xml').send(twiml.toString());
  } catch (error) {
    console.error('WhatsApp webhook failed:', error.message);
    res.status(500).send('Unable to process message');
  }
});

// ---------- 2. Remote optometrist bridge ----------
// Accepts the optometrist key or the Eyeze bridge key (the Eyeze server forwards portal replies with it).
// An unset key never matches: without this, a missing header would equal a missing env var and get in.
const crypto = require('crypto');
const same = (a, b) => !!a && !!b && a.length === b.length && crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
const auth = (req, res, next) => {
  const k = req.header('x-api-key') || '';
  return same(k, process.env.OPTOMETRIST_API_KEY) || same(k, process.env.WHATSAPP_BRIDGE_KEY) ? next() : res.status(401).json({ error: 'bad api key' });
};
app.use('/api', (req, res, next) => { res.set('Access-Control-Allow-Origin', '*'); res.set('Access-Control-Allow-Headers', 'x-api-key, content-type'); req.method === 'OPTIONS' ? res.end() : next(); });

app.get('/api/profiles', auth, (_, res) => res.json(store.allProfiles()));

// Optometrist replies from the portal -> goes to the patient's WhatsApp
app.post('/api/profiles/:phone/reply', auth, async (req, res) => {
  const phone = decodeURIComponent(req.params.phone);
  const { text } = req.body;
  if (!text) return res.status(400).json({ error: 'text required' });
  if (!/^whatsapp:\+?\d{8,15}$/.test(phone)) return res.status(400).json({ error: 'phone must look like whatsapp:+91…' });
  // The Eyeze server sends the patient's language along, so a reply still goes out if this bot restarted and
  // lost its local copy of the profile (Render's free disk is wiped on redeploy).
  const p = store.setReply(phone, { text, at: new Date().toISOString() }) || (req.body.lang ? { lang: req.body.lang } : null);
  if (!p) return res.status(404).json({ error: 'no such patient' });
  if (!client) return res.json({ ok: true, sent: false, note: 'Twilio credentials missing; saved only' });
  try {
    const from = process.env.TWILIO_WHATSAPP_FROM;
    await client.messages.create({ from, to: phone, body: text });
    // Also send it as audio. The text must be in the same language as `lang` ('en' | 'hi' | 'kn').
    let voiceSent = false;
    if (req.body.voice !== false) {
      try {
        const li = Math.max(0, ['en', 'hi', 'kn'].indexOf(req.body.lang || p.lang || 'en'));
        const file = await withTimeout(speak(text, li), 15000);
        if (file) { await client.messages.create({ from, to: phone, mediaUrl: [`${baseUrl(req)}/audio/${file}`] }); voiceSent = true; }
      } catch (e) { console.error('Voice reply failed (text was sent):', e.message); }
    }
    res.json({ ok: true, sent: true, voiceSent });
  } catch (e) { res.status(502).json({ ok: false, error: e.message }); }
});

const port = process.env.PORT || 3000;
if (require.main === module) app.listen(port, () => console.log(`Listening on http://localhost:${port}`));
module.exports = app;