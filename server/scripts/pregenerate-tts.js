// Generate Sarvam TTS audio for every fixed question and prompt, in every language, and store it.
// After this the interview plays from the cache. Usage: npm run pregenerate-tts  (server must be running)
// Set API_URL if the server isn't on http://localhost:4000.
import { Q, LANGS, tx, t } from '../../client/src/shared/index.js';

const API = (process.env.API_URL || 'http://localhost:4000').replace(/\/$/, '');
const FIXED = ['consentSay', 'profileDone', 'urgentTitle'];

/** POST one clip; if the server is restarting or drops the connection, wait and retry. */
async function post(text, lang, attempt = 0) {
  try {
    return await fetch(API + '/api/voice/tts', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text, lang }) });
  } catch (e) {
    if (attempt >= 4) return null;
    console.warn(`Server not reachable (${e.cause?.code || e.message}), retrying in ${2 * (attempt + 1)} s...`);
    await new Promise(res => setTimeout(res, 2000 * (attempt + 1)));
    return post(text, lang, attempt + 1);
  }
}

let n = 0, failed = 0;
for (const lang of Object.keys(LANGS)) {
  const texts = new Set([
    ...Q.map(q => tx(q.t, lang)),
    ...Q.filter(q => q.lead).map(q => tx(q.lead, lang) + ' ' + tx(q.t, lang)),
    ...Q.map(q => t('secIn_' + q.sec, lang) + ' ' + tx(q.t, lang)),
    ...FIXED.map(k => t(k, lang)),
    t('urgentTitle', lang) + '. ' + t('urgentBody', lang),
  ]);
  for (const text of texts) {
    const r = await post(text, lang);
    if (r?.ok) n++; else { failed++; console.warn(lang, r ? r.status : 'server unreachable', r ? (await r.json().catch(() => ({}))).error : '', '-', text.slice(0, 40)); }
    await new Promise(res => setTimeout(res, 1100)); // stay under the 60 requests/min rate limit
  }
  console.log(`${LANGS[lang].name}: done`);
}
console.log(`Cached ${n} clips${failed ? `, ${failed} failed` : ''}.`);
