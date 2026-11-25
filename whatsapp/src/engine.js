// The conversation engine. Pure logic: (session, incoming message) -> (session, replies).
// No Twilio code in here, so it can be tested from the terminal and reused for other channels.
const { QMAP, visibleQs } = require('./questions');
const { computeResult, LENS, TIPS } = require('./scoring');
const { M, t, LANGS } = require('./i18n');

const newSession = () => ({ step: 'lang', lang: 0, name: '', age: 0, answers: {}, history: [], current: null, done: false, voice: false });

// ---------- rendering ----------
function renderQuestion(q, li) {
  const lines = q.o.map((o, i) => `${i + 1}️⃣ ${o.l[li] ?? o.l[0]}`);
  const how = t(q.type === 'multi' ? 'multi' : 'single', li);
  return `*${q.t[li] ?? q.t[0]}*\n\n${lines.join('\n')}\n\n_${how}_`;
}

function bar(pct) { // 0..100 -> ███░░░░░
  const n = Math.round(pct / 12.5);
  return '█'.repeat(n) + '░'.repeat(8 - n);
}

function renderProfile(s, r) {
  const li = s.lang;
  const d = r.dom;
  const out = [
    `👁️ *${t('profileTitle', li)}*`,
    `${s.name}, ${s.age}`,
    '',
    `*${t('dominance', li)}*`,
    `${t('near', li)}   ${bar(d.near)} ${d.near}%`,
    `${t('mid', li)}    ${bar(d.mid)} ${d.mid}%`,
    `${t('far', li)}    ${bar(d.far)} ${d.far}%`,
    '',
    M.level[r.tri][li],
    `🔎 ${t('lensLine', li)}: *${LENS[r.lens][li]}*`,
    '',
    `*${t('tipsTitle', li)}*`,
    ...r.tips.map(k => `${TIPS[k][0]} ${TIPS[k][1][li]}`),
    '',
    t('sent', li),
  ];
  return out.join('\n');
}


// ---------- spoken numbers: "four", "चार", "ನಾಲ್ಕು", "one and three" -> "4", "4", "4", "1,3" ----------
const NUMWORDS = {
  one:1, won:1, two:2, to:2, too:2, three:3, four:4, for:4, five:5, six:6, seven:7,
  ek:1, do:2, teen:3, char:4, chaar:4, paanch:5, panch:5, chhe:6, chhah:6, saat:7, sat:7,
  'एक':1, 'दो':2, 'तीन':3, 'चार':4, 'पाँच':5, 'पांच':5, 'छह':6, 'छः':6, 'छे':6, 'सात':7,
  ondu:1, eradu:2, mooru:3, muru:3, nalku:4, naalku:4, aidu:5, aaru:6, elu:7, yelu:7,
  'ಒಂದು':1, 'ಎರಡು':2, 'ಮೂರು':3, 'ನಾಲ್ಕು':4, 'ಐದು':5, 'ಆರು':6, 'ಏಳು':7,
};
const FILLER = new Set(['and', 'aur', 'mattu', 'option', 'options', 'number', 'numbers', 'answer', 'the', 'is', 'और', 'नंबर', 'विकल्प', 'ಮತ್ತು', 'ಸಂಖ್ಯೆ', 'ಆಯ್ಕೆ']);
function spokenToDigits(raw) {
  // Devanagari / Kannada digits -> 0-9
  let r = raw.replace(/[०-९]/g, c => '०१२३४५६७८९'.indexOf(c)).replace(/[೦-೯]/g, c => '೦೧೨೩೪೫೬೭೮೯'.indexOf(c));
  const toks = r.split(/[\s,.&+;]+/).filter(Boolean);
  if (!toks.length) return r;
  const out = [];
  for (const t of toks) {
    if (/^\d+$/.test(t)) out.push(t);
    else if (NUMWORDS[t] !== undefined) out.push(String(NUMWORDS[t]));
    else if (!FILLER.has(t)) return r;          // a real word in there: leave it for keyword matching
  }
  return out.length ? out.join(',') : r;
}

// ---------- parsing a reply for a question ----------
function parseChoice(q, text) {
  const raw = spokenToDigits(text.trim().toLowerCase());
  const n = q.o.length;
  // numbers: "2", "1,3", "1 3", "1 and 3"
  const nums = (raw.match(/\d+/g) || []).map(Number);
  const numericOnly = /^[\d\s,.&+and]+$/.test(raw.replace(/और|ಮತ್ತು/g, 'and'));
  if (nums.length && numericOnly && nums.every(x => x >= 1 && x <= n)) {
    let picked = [...new Set(nums)].map(x => q.o[x - 1].v);
    if (q.type === 'single') return picked.length === 1 ? picked : null;
    return picked;
  }
  // keywords, so "kheti" or "ಕೃಷಿ" works as well as "1"
  const hits = q.o.filter(o => (o.kw || []).some(k => raw.includes(k.toLowerCase())));
  // also accept the option's own label, in any language ("Student", "ವಿದ್ಯಾರ್ಥಿ", or just "farming")
  const clean = raw.replace(/[.!?,।]+$/g, '').trim();
  const byLabel = q.o.filter(o => o.l.some(l => { const x = l.toLowerCase(); return x === clean || (clean.length >= 4 && x.startsWith(clean)); }));
  const all = [...new Set([...hits, ...byLabel])];
  if (q.type === 'single' && all.length === 1) return [all[0].v];
  if (q.type === 'single' && byLabel.length === 1) return [byLabel[0].v];   // exact label beats a loose keyword clash
  if (q.type === 'multi' && all.length) return all.map(o => o.v);
  return null;
}

function applyAnswer(s, q, picked) {
  if (q.type === 'multi') {
    // "None of these" is exclusive
    if (q.excl && picked.includes(q.excl)) picked = [q.excl];
    s.answers[q.id] = picked;
  } else s.answers[q.id] = picked[0];
  s.history.push(q.id);
}

// ---------- adaptive next-question picker ----------
function nextQuestion(s) {
  // Recompute the visible list from answers so far; first unanswered one is next.
  return visibleQs(s.answers, s.age).find(q => !(q.id in s.answers)) || null;
}

function finish(s) {
  s.done = true; s.step = 'done';
  s.result = computeResult({ answers: s.answers, age: s.age });
  s.finishedAt = new Date().toISOString();
  return [renderProfile(s, s.result), t('again', s.lang)];
}

function ask(s, replies) {
  const q = nextQuestion(s);
  if (!q) { replies.push(...finish(s)); return; }
  s.step = 'q'; s.current = q.id;
  replies.push(renderQuestion(q, s.lang));
}

// ---------- main entry ----------
function handle(s, text, { hasAudio = false } = {}) {
  const replies = [];
  const msg = (text || '').trim();
  const low = msg.toLowerCase();

  // "voice" / "text" switch spoken replies on and off at any point
  if ((low === 'voice' || low === 'text') && s.step !== 'lang') {
    s.voice = low === 'voice';
    replies.push(t(s.voice ? 'voiceOn' : 'voiceOff', s.lang));
    if (s.step === 'q') replies.push(renderQuestion(QMAP[s.current], s.lang));
    return { s, replies };
  }

  if (['restart', 'reset', 'hi', 'hello', 'start', 'namaste', 'नमस्ते', 'ನಮಸ್ಕಾರ'].includes(low) || s.step === 'done' && low) {
    const keepVoice = s.voice;
    Object.assign(s, newSession());
    s.voice = keepVoice;
    replies.push(M.welcome[0]);
    return { s, replies };
  }
  if (hasAudio && !msg) { replies.push(t('voice', s.lang)); return { s, replies }; }

  switch (s.step) {
    case 'lang': {
      const n = parseInt(msg, 10);
      const map = { 1: 0, 2: 1, 3: 2 };
      const byName = /hindi|हिन्दी|हिंदी/i.test(msg) ? 1 : /kannada|ಕನ್ನಡ/i.test(msg) ? 2 : /english/i.test(msg) ? 0 : undefined;
      const li = byName ?? map[n];
      if (li === undefined) { replies.push(M.welcome[0]); break; }
      s.lang = li; s.step = 'consent';
      replies.push(t('consent', li));
      break;
    }
    case 'consent':
      s.step = 'name'; replies.push(t('askName', s.lang)); break;
    case 'name':
      if (msg.length < 1 || msg.length > 60) { replies.push(t('askName', s.lang)); break; }
      s.name = msg.replace(/[*_~`]/g, ''); s.step = 'age';
      replies.push(t('askAge', s.lang).replace('{name}', s.name));
      break;
    case 'age': {
      const age = parseInt(msg.replace(/\D/g, ''), 10);
      if (!(age >= 5 && age <= 110)) { replies.push(t('badAge', s.lang)); break; }
      s.age = age;
      ask(s, replies);
      replies.push(t('hint', s.lang));
      break;
    }
    case 'q': {
      if (low === 'back') {
        const last = s.history.pop();
        if (last) delete s.answers[last];
        // anything that depended on the removed answer may no longer be visible: drop it
        const vis = new Set(visibleQs(s.answers, s.age).map(q => q.id));
        for (const id of Object.keys(s.answers)) if (!vis.has(id)) { delete s.answers[id]; s.history = s.history.filter(h => h !== id); }
        ask(s, replies);
        break;
      }
      const q = QMAP[s.current];
      const picked = parseChoice(q, msg);
      if (!picked) { replies.push(`${t('retry', s.lang)}\n\n${renderQuestion(q, s.lang)}`); break; }
      applyAnswer(s, q, picked);
      // Red-flag answers interrupt immediately (safety first, then continue)
      if (q.id === 'redflag' && picked.some(v => v !== 'none')) replies.push(t('urgent', s.lang));
      ask(s, replies);
      break;
    }
  }
  return { s, replies };
}

module.exports = { newSession, handle };