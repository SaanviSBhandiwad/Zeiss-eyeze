// WhatsApp bridge: the bot (whatsapp/) posts each finished conversation here. It becomes a normal report in the
// optometrist queue: answers mapped to the app's questions, triage from the shared engine, tagged as WhatsApp.
import crypto from 'node:crypto';
import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { LANGS, computeResult, fromWhatsApp, waPhone, CHANNEL_WHATSAPP } from '../../client/src/shared/index.js';
import { config } from '../config.js';
import { store } from '../services/store.js';
import { cleanAnswers } from './profiles.js';

export const whatsappRouter = Router();
whatsappRouter.use(rateLimit({ windowMs: 60_000, limit: 60, standardHeaders: true, legacyHeaders: false }));

const same = (a, b) => !!a && !!b && a.length === b.length && crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
const newPid = () => 'EZ-' + new Date().toISOString().slice(2, 10).replace(/-/g, '') + '-' + String(1000 + crypto.randomInt(9000));

whatsappRouter.post('/', async (req, res, next) => {
  try {
    if (!config.whatsapp.bridgeKey) return res.status(503).json({ error: 'WhatsApp bridge is not configured (WHATSAPP_BRIDGE_KEY)' });
    if (!same(req.get('x-bridge-key') || '', config.whatsapp.bridgeKey)) return res.status(401).json({ error: 'Bad bridge key' });
    const b = req.body || {};
    const phone = waPhone(b.phone);
    if (!phone) return res.status(400).json({ error: 'phone is required' });
    const lang = Object.hasOwn(LANGS, b.lang) ? b.lang : 'en';
    const answers = cleanAnswers(fromWhatsApp(b.answers || {}, { age: b.age }), { channel: CHANNEL_WHATSAPP });
    const result = computeResult({ answers, tests: {}, age: answers.age }); // same engine as app reports
    const profile = await store.createProfile({
      pid: newPid(), patientId: null, // no app login: the WhatsApp number is the contact
      name: String(b.name || '').trim().slice(0, 80) || 'WhatsApp patient', age: answers.age || 0, gender: '', village: '',
      phone, lang, answers, tests: {}, voiceAns: {}, noteEn: answers.note || '',
      triage: result.tri, result, assisted: null,
    });
    res.status(201).json({ profile: { id: profile.id, pid: profile.pid, triage: result.tri } });
  } catch (e) { next(e); }
});
