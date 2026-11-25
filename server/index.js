import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { config, mode, useSarvam, useSupabase, useGoogle, useWhatsApp } from './config.js';
import { storageMode } from './services/s3.js';
import { authRouter } from './routes/auth.js';
import { profilesRouter } from './routes/profiles.js';
import { voiceRouter } from './routes/voice.js';
import { eventsRouter } from './routes/events.js';
import { meetRouter } from './routes/meet.js';
import { whatsappRouter } from './routes/whatsapp.js';

const app = express();
app.set('trust proxy', 1); // Render sits behind a proxy; needed for per-IP rate limits
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors({ origin: config.clientOrigins, credentials: false }));
app.use(express.json({ limit: '200kb' }));

app.get('/api/health', (_req, res) => res.json({ ok: true }));
/* Tells the browser which services are live, so it can fall back gracefully. */
app.get('/api/config', (_req, res) => res.json({
  mode,
  sarvam: useSarvam,
  storage: storageMode,
  google: useGoogle,
  supabase: useSupabase ? { url: config.supabase.url, anonKey: config.supabase.anonKey } : null,
  // The app shows a "Chat on WhatsApp" button when a number is set.
  whatsapp: config.whatsapp.number ? { number: config.whatsapp.number, join: config.whatsapp.joinCode } : null,
}));

app.use('/api/auth', authRouter);
app.use('/api/profiles', profilesRouter);
app.use('/api/voice', voiceRouter);
app.use('/api/events', eventsRouter);
app.use('/api/meet', meetRouter);
app.use('/api/integrations/whatsapp', whatsappRouter);

app.use('/api', (_req, res) => res.status(404).json({ error: 'Not found' }));
// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(err.status || 500).json({ error: err.expose ? err.message : 'Something went wrong' });
});

app.listen(config.port, () => {
  console.log(`Eyeze API on :${config.port} — data: ${mode}, voice: ${useSarvam ? 'Sarvam' : 'browser fallback'}, storage: ${storageMode}, meet: ${useGoogle ? 'Google' : 'off'}, whatsapp: ${useWhatsApp ? 'bridge on' : 'off'}`);
});
