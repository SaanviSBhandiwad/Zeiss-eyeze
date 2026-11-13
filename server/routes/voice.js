import { Router } from 'express';
import express from 'express';
import crypto from 'node:crypto';
import multer from 'multer';
import rateLimit from 'express-rate-limit';
import { LANGS } from '../../client/src/shared/index.js';
import { config, useSarvam } from '../config.js';
import { requireAuth } from '../services/auth.js';
import { transcribeBoth, textToSpeech, translate, SarvamError } from '../services/sarvam.js';
import { exists, putObject, readUrl, uploadTarget, safeKey, local, storageMode } from '../services/s3.js';
import { verifyKey } from '../services/sign.js';

export const voiceRouter = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: local.maxUpload, files: 1 } });
const limit = n => rateLimit({ windowMs: 60_000, limit: n, standardHeaders: true, legacyHeaders: false });
const isLang = l => Object.hasOwn(LANGS, l);
const AUDIO = /^audio\/(wav|x-wav|wave|webm|ogg|mpeg|mp4)(;.*)?$/;

const sarvamOnly = (_req, res, next) => useSarvam ? next() : res.status(503).json({ error: 'Sarvam is not configured', fallback: true });
const fail = (res, e) => res.status(e instanceof SarvamError && e.status < 500 ? 502 : 503).json({ error: e.message, fallback: true });

/* Speech to text. The patient isn't signed in yet during the interview, so this is open but rate-limited. */
voiceRouter.post('/stt', limit(40), sarvamOnly, upload.single('audio'), async (req, res) => {
  const lang = isLang(req.body?.lang) ? req.body.lang : 'en';
  const f = req.file;
  if (!f || !AUDIO.test(f.mimetype)) return res.status(400).json({ error: 'Send a WAV or WebM clip as "audio"' });
  try { res.json(await transcribeBoth(f.buffer, f.mimetype.split(';')[0], lang)); }
  catch (e) { fail(res, e); }
});

/*
 * Text to speech with a cache. Questions are fixed, so after the first request (or after
 * running scripts/pregenerate-tts.js) every question is served straight from storage.
 */
const ttsInflight = new Map();
voiceRouter.post('/tts', limit(60), sarvamOnly, async (req, res) => {
  const text = String(req.body?.text || '').trim().slice(0, 2400);
  const lang = isLang(req.body?.lang) ? req.body.lang : 'en';
  if (!text) return res.status(400).json({ error: 'text is required' });
  const c = config.sarvam;
  const hash = crypto.createHash('sha256').update([c.ttsModel, c.ttsSpeaker, c.ttsPace, lang, text].join('|')).digest('hex').slice(0, 32);
  const key = `tts/${lang}/${hash}.wav`;
  try {
    if (!(await exists(key))) {
      if (!ttsInflight.has(key)) ttsInflight.set(key, textToSpeech(text, lang).then(buf => putObject(key, buf, 'audio/wav')).finally(() => ttsInflight.delete(key)));
      await ttsInflight.get(key);
    }
    res.json({ url: await readUrl(key, 6 * 3600) });
  } catch (e) { fail(res, e); }
});

/* Translation for either signed-in role (patient free text → English, notes → patient language). */
voiceRouter.post('/translate', limit(60), requireAuth(), sarvamOnly, async (req, res) => {
  const { text, from, to } = req.body || {};
  if (!isLang(from) || !isLang(to)) return res.status(400).json({ error: 'from/to must be en, hi or kn' });
  try { res.json({ text: await translate(String(text || '').slice(0, 4000), from, to) }); }
  catch (e) { fail(res, e); }
});

/* Where to upload a recorded answer. With S3 this is a presigned POST straight to the bucket. */
voiceRouter.post('/upload', limit(60), async (req, res, next) => {
  try {
    const { pid, qid, contentType = 'audio/wav' } = req.body || {};
    if (!/^EZ-\d{6}-\d{4}$/.test(pid) || !/^[a-z_]{2,20}$/.test(qid) || !AUDIO.test(contentType)) return res.status(400).json({ error: 'Bad upload request' });
    const ext = contentType.includes('webm') ? 'webm' : 'wav';
    res.json(await uploadTarget(`voice/${pid}/${qid}-${crypto.randomBytes(6).toString('hex')}.${ext}`, contentType));
  } catch (e) { next(e); }
});

/* Optometrist plays a patient's recorded answer. */
voiceRouter.get('/clip', requireAuth('optometrist'), async (req, res, next) => {
  try {
    const key = String(req.query.key || '');
    if (!safeKey(key) || !key.startsWith('voice/')) return res.status(400).json({ error: 'Bad key' });
    res.json({ url: await readUrl(key, 900) });
  } catch (e) { next(e); }
});

/* Local storage (demo mode, no S3): signed upload and download URLs. */
voiceRouter.put('/local/*', express.raw({ type: 'audio/*', limit: local.maxUpload }), async (req, res) => {
  const key = req.params[0];
  if (storageMode !== 'local' || !safeKey(key) || !verifyKey(key, 'PUT', req.query.exp, req.query.sig)) return res.status(403).end();
  if (!Buffer.isBuffer(req.body) || !req.body.length) return res.status(400).end();
  await local.write(key, req.body);
  res.status(204).end();
});
voiceRouter.get('/local/*', async (req, res) => {
  const key = req.params[0];
  if (storageMode !== 'local' || !safeKey(key) || !verifyKey(key, 'GET', req.query.exp, req.query.sig)) return res.status(403).end();
  try {
    const buf = await local.read(key);
    res.type(key.endsWith('.webm') ? 'audio/webm' : 'audio/wav').set('Cache-Control', 'private, max-age=3600').send(buf);
  } catch { res.status(404).end(); }
});
