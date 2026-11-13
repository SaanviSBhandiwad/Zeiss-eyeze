import { Router } from 'express';
import {
  QMAP, LENS, COAT, NEXT, CMAP, LANGS, TRI_RANK, ST_RANK, computeResult, replyText, t,
} from '../../client/src/shared/index.js';
import { requireAuth } from '../services/auth.js';
import { store } from '../services/store.js';
import { translate, textToSpeech } from '../services/sarvam.js';
import { useSarvam } from '../config.js';
import { putObject, readUrl, safeKey } from '../services/s3.js';

export const profilesRouter = Router();

const str = (v, n = 120) => String(v ?? '').trim().slice(0, n);
const isLang = l => Object.hasOwn(LANGS, l);

/** Keep only known question ids with sensibly typed values. */
function cleanAnswers(a) {
  const out = {};
  if (!a || typeof a !== 'object') return out;
  for (const [k, v] of Object.entries(a)) {
    const q = QMAP[k];
    if (!q) continue;
    if (q.type === 'age' || q.type === 'hours') { const n = Number(v); if (Number.isFinite(n)) out[k] = Math.max(0, Math.min(120, Math.round(n))); }
    else if (q.type === 'text') out[k] = str(v, 1000);
    else if (Array.isArray(v)) out[k] = v.slice(0, 12).map(x => str(x, 32));
    else if (typeof v === 'string') out[k] = str(v, 32);
  }
  return out;
}

function cleanVoice(v) {
  const out = {};
  if (!v || typeof v !== 'object') return out;
  for (const [k, x] of Object.entries(v)) {
    if (!QMAP[k] || !x || typeof x !== 'object') continue;
    out[k] = { text: str(x.text, 500), en: str(x.en, 500), clip: safeKey(x.clip) && x.clip.startsWith('voice/') ? x.clip : null };
  }
  return out;
}

const sortQueue = list => list
  .map(r => ({ r, tri: r.triage || computeResult(r).tri }))
  .sort((a, b) => (ST_RANK[a.r.status] - ST_RANK[b.r.status]) || (TRI_RANK[a.tri] - TRI_RANK[b.tri]) || (b.r.ts - a.r.ts))
  .map(x => x.r);

/* Patient submits a report ("Send to optometrist"). */
profilesRouter.post('/', requireAuth('patient'), async (req, res, next) => {
  try {
    const b = req.body || {};
    const lang = isLang(b.lang) ? b.lang : 'en';
    const answers = cleanAnswers(b.answers);
    const name = str(b.name, 80);
    if (!name) return res.status(400).json({ error: 'Name is required' });
    const tests = b.tests && typeof b.tests === 'object' ? JSON.parse(JSON.stringify(b.tests).slice(0, 20000)) : {};
    const result = computeResult({ answers, tests, age: answers.age }); // never trust a client-side triage
    let noteEn = '';
    if (answers.note) noteEn = lang === 'en' ? answers.note : useSarvam ? await translate(answers.note, lang, 'en').catch(() => '') : '';

    const patient = { id: req.user.id, name, village: str(b.village, 80), phone: req.user.phone || str(b.phone, 20), lang };
    await store.upsertPatient(patient);
    const profile = await store.createProfile({
      pid: /^EZ-\d{6}-\d{4}$/.test(b.pid) ? b.pid : null,
      patientId: req.user.id, name, age: answers.age || 0, gender: str(b.gender, 10), village: patient.village,
      phone: patient.phone, lang, answers, tests, voiceAns: cleanVoice(b.voiceAns), noteEn,
      triage: result.tri, result, assisted: b.assisted ? 'Health worker assisted' : null,
    });
    res.status(201).json({ profile });
  } catch (e) { next(e); }
});

/* Patient: my reports, with a playable URL for the voice reply. */
profilesRouter.get('/mine', requireAuth('patient'), async (req, res, next) => {
  try {
    const list = await store.listByPatient(req.user.id);
    for (const p of list) if (p.reply?.audioKey) p.reply.audioUrl = await readUrl(p.reply.audioKey);
    res.json({ profiles: list });
  } catch (e) { next(e); }
});

/* Optometrist queue: sorted by status, triage and waiting time. */
profilesRouter.get('/', requireAuth('optometrist'), async (_req, res, next) => {
  try { res.json({ profiles: sortQueue(await store.listProfiles()) }); } catch (e) { next(e); }
});

profilesRouter.get('/:id', requireAuth(), async (req, res, next) => {
  try {
    const p = await store.getProfile(req.params.id);
    if (!p || (req.user.role !== 'optometrist' && p.patientId !== req.user.id)) return res.status(404).json({ error: 'Not found' });
    res.json({ profile: p });
  } catch (e) { next(e); }
});

/* Optometrist opened the report: patient sees "Optometrist is reviewing". */
profilesRouter.post('/:id/open', requireAuth('optometrist'), async (req, res, next) => {
  try {
    const p = await store.getProfile(req.params.id);
    if (!p) return res.status(404).json({ error: 'Not found' });
    if (p.status === 'new') await store.setStatus(p.id, 'review');
    res.json({ ok: true });
  } catch (e) { next(e); }
});

/* Optometrist reply: translated into the patient's language, spoken with Sarvam TTS, stored. */
profilesRouter.post('/:id/reply', requireAuth('optometrist'), async (req, res, next) => {
  try {
    const p = await store.getProfile(req.params.id);
    if (!p) return res.status(404).json({ error: 'Not found' });
    const b = req.body || {};
    if (!LENS[b.lens] || !NEXT[b.next] || !CMAP[b.centre]) return res.status(400).json({ error: 'Choose a lens, next step and location' });
    const rep = { lens: b.lens, coat: (Array.isArray(b.coat) ? b.coat : []).filter(c => COAT[c]), next: b.next, centre: b.centre, notes: str(b.notes, 1000) };

    let notesTranslated = rep.notes, warnings = [];
    if (rep.notes && p.lang !== 'en') {
      if (useSarvam) notesTranslated = await translate(rep.notes, 'en', p.lang).catch(e => { warnings.push('Translation failed: ' + e.message); return rep.notes; });
      else warnings.push('Sarvam is not configured, so the note is sent in English');
    }
    const text = replyText(p.name, rep, p.lang) + (notesTranslated ? ` ${t('docNote', p.lang)}: ${notesTranslated}` : '');

    let audioKey = null;
    if (useSarvam) {
      try {
        const wav = await textToSpeech(text, p.lang);
        audioKey = `replies/${p.id}/${Date.now()}.wav`;
        await putObject(audioKey, wav, 'audio/wav');
      } catch (e) { warnings.push('Voice message failed: ' + e.message); audioKey = null; }
    }
    await store.addReply(p.id, { ...rep, notesTranslated, text, audioKey }, req.user.id);
    res.json({ profile: await store.getProfile(p.id), warnings });
  } catch (e) { next(e); }
});

/* "Edit and resend": withdraw the current reply. */
profilesRouter.delete('/:id/reply', requireAuth('optometrist'), async (req, res, next) => {
  try { await store.clearReply(req.params.id); res.json({ profile: await store.getProfile(req.params.id) }); } catch (e) { next(e); }
});
