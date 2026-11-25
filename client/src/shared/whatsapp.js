// WhatsApp bot → Eyeze answers. The bot (whatsapp/) uses an older version of the same question bank, so its
// answers are mapped onto the app's question ids and values here. The shared triage engine (computeResult)
// then scores WhatsApp patients exactly like app patients, and the portal shows them the same way.
// Anything the app has no question for (symptoms such as double vision) goes into the patient's note.

/** Marks a report as coming from WhatsApp (kept by the server, read by the portal). */
export const CHANNEL_WHATSAPP = 'whatsapp';

// Hour bands → hours (middle of the band; ">6 h" counts as 8).
const HOURS = { h0: 0, h1: 2, h3: 4, h6: 8 };
// "Which distances are hard?" → the app's picture items for that distance (the bot's labels name the same things).
const ZONE_ITEMS = { far: ['bus', 'face', 'sign'], mid: ['cook', 'computer', 'counter'], near: ['paper', 'phone', 'needle'] };
const SAME = ['glasses_age', 'drive', 'night', 'presby', 'switching', 'diab_spots', 'diab_check', 'priority'];
const SYMPTOM_EN = { headache: 'headaches', strain: 'tired or strained eyes', water: 'watering or itching', light: 'bright light is uncomfortable', double: 'double vision' };
const REDFLAG = { sudden: 'loss', pain: 'pain', flash: 'flash', curtain: 'curtain', none: 'none' };

const arr = v => (Array.isArray(v) ? v : v == null || v === '' ? [] : [v]);

/** Map a finished bot session's answers (+ age) to Eyeze answers. Unknown values are dropped, never guessed. */
export function fromWhatsApp(bot = {}, { age } = {}) {
  const a = {};
  if (Number.isFinite(+age) && +age > 0) a.age = Math.round(+age);

  // occupation → work (same values)
  if (typeof bot.occupation === 'string') a.work = bot.occupation;

  // glasses: one bot question covers "do you wear them", "for what" and "readymade"
  const g = bot.glasses;
  if (g === 'none') a.glasses = 'no';
  else if (g === 'distance' || g === 'reading' || g === 'both') { a.glasses = 'yes'; a.glasses_for = { distance: 'far', reading: 'read', both: 'both' }[g]; }
  else if (g === 'readymade') { a.glasses = 'yes'; a.glasses_src = 'market'; }

  for (const k of SAME) if (typeof bot[k] === 'string') a[k] = bot[k];

  // hour bands
  if (bot.screen in HOURS) a.phone = HOURS[bot.screen];
  if (bot.nearwork in HOURS) a.nearwork = HOURS[bot.nearwork];
  if (bot.outdoor in HOURS) a.outdoor = HOURS[bot.outdoor];

  // difficult distances → picture items (drives the near/mid/far zones) and the main complaint
  const diff = arr(bot.difficulty).filter(z => ZONE_ITEMS[z]);
  if (arr(bot.difficulty).length) a.scene = diff.flatMap(z => ZONE_ITEMS[z]);
  const sym = arr(bot.symptoms).filter(s => s !== 'none');
  if (diff.includes('far')) a.cc = 'far';
  else if (diff.includes('near')) a.cc = 'near';
  else if (sym.includes('strain') || sym.includes('headache')) a.cc = 'strain';
  else if (sym.includes('water')) a.cc = 'irrit';
  else if (arr(bot.difficulty).includes('none') && !sym.length) a.cc = 'checkup';

  // multi-selects with the same values ('thyroid' simply never appears)
  for (const k of ['medical', 'family']) if (bot[k] !== undefined) a[k] = arr(bot[k]).filter(v => typeof v === 'string');
  if (bot.redflag !== undefined) a.redflag = [...new Set(arr(bot.redflag).map(v => REDFLAG[v]).filter(Boolean))];

  // symptoms the app has no question for: keep them for the optometrist
  const extra = sym.map(s => SYMPTOM_EN[s]).filter(Boolean);
  if (extra.length) a.note = 'Symptoms reported on WhatsApp: ' + extra.join(', ') + '.';

  a.channel = CHANNEL_WHATSAPP;
  return a;
}

/** "whatsapp:+919845012345" → "+919845012345" (or '' if it doesn't look like a phone number). */
export function waPhone(from) {
  const p = String(from || '').replace(/^whatsapp:/i, '').replace(/[^\d+]/g, '');
  return /^\+?\d{8,15}$/.test(p) ? p : '';
}
