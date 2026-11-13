// Sarvam AI: speech to text, text to speech, translation.
// Docs: https://docs.sarvam.ai  (auth header: api-subscription-key)
// Model names are configurable in .env because Sarvam ships new versions often.
import { config, useSarvam } from '../config.js';

const S = config.sarvam;
export const LANG_CODE = { en: 'en-IN', hi: 'hi-IN', kn: 'kn-IN' };

export class SarvamError extends Error {
  constructor(message, status) { super(message); this.status = status; }
}

async function call(path, init, attempt = 0) {
  if (!useSarvam) throw new SarvamError('Sarvam is not configured', 503);
  const res = await fetch(S.base + path, { ...init, headers: { 'api-subscription-key': S.key, ...(init.headers || {}) } });
  if ((res.status === 429 || res.status === 503) && attempt < 2) {
    await new Promise(r => setTimeout(r, 600 * 2 ** attempt));
    return call(path, init, attempt + 1);
  }
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new SarvamError(body?.error?.message || `Sarvam ${path} failed (${res.status})`, res.status);
  return body;
}

/**
 * Transcribe a short clip (under ~30 s). mode 'transcribe' keeps the spoken language,
 * mode 'translate' returns English.
 */
export async function speechToText(audio, { mime = 'audio/wav', lang = 'unknown', mode = 'transcribe' } = {}) {
  const fd = new FormData();
  fd.append('file', new Blob([audio], { type: mime }), mime.includes('webm') ? 'answer.webm' : 'answer.wav');
  fd.append('model', S.sttModel);
  fd.append('mode', mode);
  if (mode === 'transcribe') fd.append('language_code', LANG_CODE[lang] || 'unknown');
  const r = await call('/speech-to-text', { method: 'POST', body: fd });
  return { transcript: (r.transcript || '').trim(), languageCode: r.language_code || null };
}

/** Native-language transcript plus an English translation, in parallel. */
export async function transcribeBoth(audio, mime, lang) {
  const native = speechToText(audio, { mime, lang, mode: 'transcribe' });
  const english = lang === 'en' ? null : speechToText(audio, { mime, mode: 'translate' }).catch(() => null);
  const [n, e] = await Promise.all([native, english]);
  return { transcript: n.transcript, english: e ? e.transcript : (lang === 'en' ? n.transcript : '') };
}

/** Speak text in lang. Returns a WAV buffer. */
export async function textToSpeech(text, lang) {
  const r = await call('/text-to-speech', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      text: clip(text, 2400),
      target_language_code: LANG_CODE[lang] || 'en-IN',
      model: S.ttsModel,
      speaker: S.ttsSpeaker,
      pace: S.ttsPace,
      speech_sample_rate: 22050,
    }),
  });
  if (!r.audios?.[0]) throw new SarvamError('Sarvam returned no audio', 502);
  return Buffer.from(r.audios.join(''), 'base64');
}

/** Translate between en / hi / kn. Long text is split on sentence boundaries. */
export async function translate(text, from, to) {
  text = String(text || '').trim();
  if (!text || from === to) return text;
  const out = [];
  for (const part of chunks(text, 900)) {
    const r = await call('/translate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        input: part,
        source_language_code: LANG_CODE[from] || 'auto',
        target_language_code: LANG_CODE[to] || 'en-IN',
        model: S.translateModel,
        mode: 'formal',
      }),
    });
    out.push(r.translated_text || '');
  }
  return out.join(' ').trim();
}

function clip(s, n) {
  s = String(s || '');
  if (s.length <= n) return s;
  const cut = s.slice(0, n), i = Math.max(cut.lastIndexOf('. '), cut.lastIndexOf('। '));
  return i > n / 2 ? cut.slice(0, i + 1) : cut;
}

function chunks(s, n) {
  const parts = s.split(/(?<=[.!?।])\s+/), out = [];
  let cur = '';
  for (const p of parts) {
    if ((cur + ' ' + p).length > n && cur) { out.push(cur); cur = p; } else cur = cur ? cur + ' ' + p : p;
  }
  if (cur) out.push(cur);
  return out.flatMap(c => c.length > n ? c.match(new RegExp(`.{1,${n}}`, 'gs')) : [c]);
}
