// Patient app state and actions (ported from the prototype's S.p and ACT handlers).
import {
  Q, QMAP, SCENE, LANGS, PERSONA, visibleQs, ansLabel, computeResult, matchAnswer, replyText, t, tx, TIPS, ZN, TRI_EN,
} from '../shared/index.js';
import { TESTS } from './tests/constants.js';
import { randDir } from './tests/utils.jsx';
import { createStore } from '../lib/store.js';
import { api, absUrl, getConfig } from '../lib/api.js';
import { getToken, sendOtp, verifyOtp, signOut } from '../lib/auth.js';
import {
  speak, stopSpeak, playUrl, canRecord, startRecording, transcribe, uploadClip, canBrowserRecognize, browserRecognize,
} from '../lib/voice.js';
import { toast } from '../lib/ui.jsx';

const SAVE = 'eyeze_patient_v2';

export function freshP() {
  return {
    screen: 'home', mode: null, consented: false, answers: {}, qhist: [], fired: {}, multiSel: null, pick: null, val: null,
    text: '', heard: null, voiceAns: {}, listening: 'idle', modal: null, login: null, result: null, pid: null,
    profileId: null, status: null, reply: null, unread: false, info: {}, assisted: false, ackAt: 0, sentAt: null, autoPlayed: false,
    tests: {}, cur: null, ts: null,
  };
}

function load() {
  try {
    const s = JSON.parse(localStorage.getItem(SAVE));
    if (s?.p) return { lang: LANGS[s.lang] ? s.lang : 'en', p: { ...freshP(), ...s.p, listening: 'idle', modal: null, login: null, pick: null, heard: null } };
  } catch { /* ignore */ }
  return null;
}
const saved = load();

export const app = createStore({
  lang: saved?.lang || 'en', voiceOn: true, simOffline: false, autopilot: false, dockOpen: false, log: [],
  p: saved?.p || freshP(),
});

app.subscribe(() => {
  const { lang, p } = app.get();
  const { listening, modal, login, pick, heard, ...keep } = p;
  try { localStorage.setItem(SAVE, JSON.stringify({ lang, p: keep })); } catch { /* storage full or blocked */ }
});

/* ---------------- helpers ---------------- */
export const L = () => app.get().lang;
export const tt = (k, v) => t(k, L(), v);
const P = () => app.get().p;
export const setP = patch => app.set(s => ({ p: { ...s.p, ...(typeof patch === 'function' ? patch(s.p) : patch) } }));

export function log(msg, kind = '') {
  const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  app.set(s => ({ log: [{ t: time, msg, kind }, ...s.log].slice(0, 80) }));
}

export const say = text => app.get().voiceOn && speak(text, L(), {
  onNoVoice: () => { if (!warned[L()]) { warned[L()] = 1; toast(tt('noVoice', { lang: LANGS[L()].name })); } },
});
const warned = {};

export const nextQ = (p = P()) => visibleQs(p.answers).find(q => p.answers[q.id] === undefined);
const newPid = () => 'EZ-' + new Date().toISOString().slice(2, 10).replace(/-/g, '') + '-' + String(1000 + Math.floor(Math.random() * 9000));
const ensurePid = () => P().pid || (setP({ pid: newPid() }), P().pid);
export const initVal = q => q.type === 'age' ? 40 : q.type === 'hours' ? (q.id === 'outdoor' ? 3 : 2) : null;

/* ---------------- navigation ---------------- */
export function go(screen) {
  setP({ screen, heard: null, pick: null });
  window.scrollTo?.(0, 0);
  document.getElementById('main')?.scrollTo?.(0, 0);
}

export function goHome() { stopSpeak(); setP({ listening: 'idle' }); go('home'); }

export function setLang(l) { app.set({ lang: l }); document.documentElement.lang = l; log('Language: ' + LANGS[l].name, 'voice'); }

export function startMode(m) {
  setP({ mode: m });
  log('Started: ' + ({ full: 'full eye check', profile: 'talk with Drishti' })[m]);
  if (!P().consented) return go('consent');
  afterConsent();
}

export function agree() { setP({ consented: true }); log('Consent given by voice/tap'); afterConsent(); }

function afterConsent() {
  if (nextQ()) { setP({ val: initVal(nextQ()) }); go('interview'); }
  else finishInterview();
}

/* ---------------- interview ---------------- */
function prune(p) {
  const vis = new Set(visibleQs(p.answers).map(q => q.id));
  const answers = Object.fromEntries(Object.entries(p.answers).filter(([k]) => vis.has(k)));
  const fired = { ...p.fired };
  for (const q of Q) if (q.cond && vis.has(q.id) && !fired[q.id]) { fired[q.id] = 1; log('Follow-up added: ' + q.rule, 'rule'); }
  return { answers, qhist: p.qhist.filter(k => vis.has(k)), fired };
}

export function setAnswer(id, val) {
  const p = P();
  if (p.answers[id] !== undefined) return;
  const q = QMAP[id];
  log(q.t[0] + ' → ' + ansLabel(q, val, 'en') + (p.voiceAns[id] ? ' (voice)' : ''), p.voiceAns[id] ? 'voice' : '');
  const next = prune({ ...p, answers: { ...p.answers, [id]: val }, qhist: [...p.qhist, id] });
  const rfv = id === 'cc_sudden' || id === 'redflag' ? (val || []).filter(v => v !== 'none') : [];
  const urgent = rfv.length || (id === 'cc_irrit' && val === 'pain');
  setP({ ...next, multiSel: null, pick: null, val: null, text: '', ackAt: Date.now(), modal: urgent ? 'urgent' : p.modal });
  if (urgent) { log('Red flag: urgent-care advice shown now, profile marked URGENT', 'alert'); say(tt('urgentTitle') + '. ' + tt('urgentBody')); }
  const n = nextQ();
  if (!n) {
    log('Interview complete: ' + P().qhist.length + ' of ' + Q.length + ' possible questions asked');
    if (!P().modal) finishInterview();
    return;
  }
  setP({ val: initVal(n) });
}

function finishInterview() {
  if (P().mode === 'full') { say(tt('profileDone')); go('testsIntro'); } else finalize();
}

export function finalize() {
  const p = P();
  const result = computeResult({ answers: p.answers, tests: p.tests, age: p.answers.age });
  const pid = p.pid || newPid();
  setP({ result, pid });
  log('Report ' + pid + ': ' + (result.dominant ? ZN[result.dominant].toLowerCase() + '-dominant, ' : '') + 'triage ' + TRI_EN[result.tri].toUpperCase(), result.tri === 'red' ? 'alert' : 'rule');
  go('result');
}

export function tapOpt(v) {
  const p = P(), q = nextQ(p);
  if (!q || p.pick) return;
  if (q.type === 'single') { setP({ pick: v }); setTimeout(() => setAnswer(q.id, v), 380); return; }
  let sel = (p.multiSel || []).slice();
  if (v === q.excl) sel = sel.includes(v) ? [] : [v];
  else { sel = sel.filter(x => x !== q.excl); sel = sel.includes(v) ? sel.filter(x => x !== v) : [...sel, v]; }
  setP({ multiSel: sel });
}

export function sceneItem(v) {
  const sel = (P().multiSel || []).slice();
  setP({ multiSel: sel.includes(v) ? sel.filter(x => x !== v) : [...sel, v] });
}
export function sceneClear() { const q = nextQ(); if (q) setAnswer(q.id, []); }

export function confirmMulti() {
  const p = P(), q = nextQ(p);
  if (!q) return;
  if (q.type === 'scene') return setAnswer(q.id, (p.multiSel || []).slice());
  if (!p.multiSel?.length) return;
  setAnswer(q.id, p.multiSel.slice());
}

export function qnext() {
  const p = P(), q = nextQ(p);
  if (!q) return;
  if (q.type === 'hours' || q.type === 'age') return setAnswer(q.id, p.val == null ? initVal(q) : p.val);
  if (q.type === 'text') return setAnswer(q.id, p.text.trim());
  confirmMulti();
}

export const setVal = v => setP({ val: v });
export const setText = v => setP({ text: v });

export function qback() {
  const p = P(), qhist = p.qhist.slice(), id = qhist.pop();
  if (!id) return;
  const prev = p.answers[id];
  const answers = { ...p.answers }; delete answers[id];
  const voiceAns = { ...p.voiceAns }; delete voiceAns[id];
  setP({
    ...prune({ ...p, answers, qhist }), voiceAns, ackAt: 0,
    multiSel: Array.isArray(prev) ? prev.slice() : null, val: typeof prev === 'number' ? prev : initVal(QMAP[id]), text: typeof prev === 'string' && QMAP[id].type === 'text' ? prev : '',
  });
}

export function urgentClose() { setP({ modal: null }); stopSpeak(); if (!nextQ()) finishInterview(); }

/* ---------------- voice answers ---------------- */
let recorder = null;

export async function startListen() {
  const s = app.get(), p = s.p, q = nextQ(p), lang = s.lang;
  if (!q) return;
  if (p.listening === 'rec') { recorder?.stop(); return; }
  if (p.listening !== 'idle') return;
  stopSpeak();

  if (s.autopilot) {
    setP({ listening: 'rec', heard: null });
    setTimeout(() => {
      if (P().listening !== 'rec') return;
      setP({ listening: 'idle' });
      const v = PERSONA.answers[q.id];
      applyVoice(q, v === undefined ? (q.type === 'text' ? '' : null) : v, null);
    }, 1400);
    return;
  }

  const cfg = await getConfig();
  if (cfg.sarvam && canRecord()) {
    try {
      setP({ listening: 'rec', heard: null });
      recorder = await startRecording({
        onDone: async wav => {
          recorder = null;
          if (!wav) { setP({ listening: 'idle' }); toast(tt('notUnderstood')); return; }
          setP({ listening: 'busy' });
          const pid = ensurePid();
          const [stt, clip] = await Promise.all([transcribe(wav, lang).catch(() => null), uploadClip(wav, pid, q.id)]);
          setP({ listening: 'idle' });
          if (nextQ()?.id !== q.id) return; // user moved on meanwhile
          if (!stt?.transcript) { toast(tt('notUnderstood')); return; }
          log('Speech recognised (Sarvam): “' + stt.transcript + '”' + (stt.english && stt.english !== stt.transcript ? ' = “' + stt.english + '”' : ''), 'voice');
          const val = matchAnswer(q, [stt.transcript, stt.english], SCENE);
          if (val == null) { setP({ heard: { q: q.id, text: stt.transcript } }); toast(tt('notUnderstood')); return; }
          applyVoice(q, val, stt.transcript, { en: stt.english, clip });
        },
      });
    } catch {
      setP({ listening: 'idle' });
      toast(tt('micDenied'));
    }
    return;
  }

  if (canBrowserRecognize()) {
    setP({ listening: 'rec', heard: null });
    const alts = await browserRecognize(lang);
    if (P().listening !== 'rec') return;
    setP({ listening: 'idle' });
    if (!alts) { toast(tt('notUnderstood')); return; }
    log('Speech recognised (browser): “' + alts[0] + '”', 'voice');
    const val = matchAnswer(q, alts, SCENE);
    if (val == null) { toast(tt('notUnderstood')); return; }
    applyVoice(q, val, alts[0]);
    return;
  }
  toast(tt('voiceFail'));
}

function applyVoice(q, val, heard, extra = {}) {
  if (val == null) return;
  const p = P();
  const voiceAns = { ...p.voiceAns, [q.id]: { text: heard || ansLabel(q, val, L()), en: extra.en || '', clip: extra.clip || null } };
  setP({ voiceAns, heard: { q: q.id, text: heard || ansLabel(q, val, L()) } });
  if (q.type === 'single') { setP({ pick: val }); setTimeout(() => setAnswer(q.id, val), 700); }
  else if (q.type === 'hours' || q.type === 'age') { setP({ val }); setTimeout(() => setAnswer(q.id, val), 900); }
  else if (q.type === 'text') { if (val === '') setAnswer(q.id, ''); else setP({ text: (p.text ? p.text + ' ' : '') + val }); }
  else setP({ multiSel: val.slice() });
}

/* ---------------- sending + login (only when sending) ---------------- */
export async function openSend() {
  const p = P();
  if (!p.result) finalize();
  const token = await getToken('patient');
  if (token && p.info.name) return sendProfile();
  setP({ modal: 'login', login: { step: 'phone', phone: '', otp: '', name: p.info.name || '', village: p.info.village || '', demoCode: null, busy: false } });
  log('Login requested only now, at the moment of sending');
}

export const updateLogin = patch => setP(p => ({ login: p.login && { ...p.login, ...patch } }));
export const loginCancel = () => setP({ modal: null, login: null });

export async function loginNext() {
  const Lg = P().login;
  if (!Lg || Lg.busy) return;
  try {
    if (Lg.step === 'phone') {
      const ph = Lg.phone.replace(/\D/g, '').replace(/^91(?=\d{10}$)/, '');
      if (ph.length !== 10) return toast(tt('badPhone'));
      updateLogin({ busy: true });
      const r = await sendOtp(ph).catch(e => { toast(tt('otpFail')); throw e; });
      updateLogin({ phone: ph, step: 'otp', demoCode: r.demoCode || null, busy: false });
      log('OTP sent to +91 ' + ph.slice(0, 5) + ' ' + ph.slice(5) + (r.demoCode ? ' (demo code ' + r.demoCode + ')' : ''), 'net');
      return;
    }
    if (Lg.step === 'otp') {
      updateLogin({ busy: true });
      await verifyOtp(Lg.phone, Lg.otp.trim()).catch(e => { toast(tt('badOtp')); throw e; });
      toast(tt('verified'));
      updateLogin({ step: 'name', busy: false });
      return;
    }
    if (Lg.step === 'name') {
      const name = Lg.name.trim();
      if (!name) return toast(tt('needName'));
      setP({ info: { name, village: Lg.village.trim(), phone: '+91 ' + Lg.phone.slice(0, 5) + ' ' + Lg.phone.slice(5) }, modal: null, login: null });
      return sendProfile();
    }
  } catch { updateLogin({ busy: false }); }
}

export async function sendProfile() {
  const pid = ensurePid(), p = P(), s = app.get();
  setP({ sentAt: Date.now() });
  if (s.simOffline || !navigator.onLine) {
    setP({ status: 'queued' });
    toast(tt('queuedToast'));
    log('No connection: report stored on the phone, will upload automatically', 'net');
    return;
  }
  try {
    const token = await getToken('patient');
    if (!token) { setP({ info: { ...p.info, name: '' } }); return openSend(); }
    const r = await api('/profiles', {
      method: 'POST', token,
      body: { pid, name: p.info.name, village: p.info.village, lang: s.lang, answers: p.answers, tests: p.tests, voiceAns: p.voiceAns, assisted: p.assisted },
    });
    setP({ status: 'sent', profileId: r.profile.id });
    toast(tt('sentToast'));
    log('Uploaded to optometrist queue with ' + TRI_EN[r.profile.triage].toUpperCase() + ' priority', 'net');
  } catch (e) {
    if (e.status === 401) { await signOut('patient'); setP({ info: { ...p.info, name: '' }, status: null }); return openSend(); }
    if (e.status === 0) { setP({ status: 'queued' }); toast(tt('sendFail')); log('Upload failed: will retry when online', 'net'); return; }
    setP({ status: null });
    toast(e.message);
  }
}

/** Retry a report saved while offline. */
export function retryQueued() {
  const s = app.get();
  if (s.p.status === 'queued' && !s.simOffline && navigator.onLine) { log('Connection restored', 'net'); sendProfile().then(() => P().status === 'sent' && toast(tt('synced'))); }
}

/** Pull the latest status and reply for the sent report. */
export async function refreshMine() {
  const p = P();
  if (!p.profileId) return;
  const token = await getToken('patient');
  if (!token) return;
  try {
    const { profiles } = await api('/profiles/mine', { token });
    const r = profiles.find(x => x.id === p.profileId);
    if (!r) return;
    const status = r.status === 'new' ? 'sent' : r.status;
    const patch = {};
    if (status !== p.status && p.status !== 'queued') {
      patch.status = status;
      if (status === 'review' && p.status !== 'review') log('Optometrist opened the profile', 'net');
    }
    const newReply = r.reply && (!p.reply || p.reply.at !== r.reply.at);
    if (newReply) { patch.reply = r.reply; patch.unread = true; patch.autoPlayed = false; toast(tt('newMsg')); log('Reply received from optometrist', 'net'); }
    else if (r.reply) patch.reply = r.reply; // refresh signed audio URL
    if (!r.reply && p.reply) patch.reply = null;
    if (Object.keys(patch).length) setP(patch);
  } catch { /* offline: try again on the next event */ }
}

export function playReply() {
  const p = P(), r = p.reply;
  if (!r) return;
  if (r.audioUrl) return playUrl(absUrl(r.audioUrl));
  speak(r.text || replyText(p.info.name || '', r, L()), L());
}

export function listenProfile() {
  const r = P().result;
  if (r) say((r.dominant ? tt('mostly', { z: tt('za_' + r.dominant) }) + ' ' : '') + tt('triD_' + r.tri) + ' ' + r.tips.slice(0, 2).map(k => tx(TIPS[k][1], L())).join(' '));
}

/** What Drishti says on each screen: [unique key, text]. */
export function speakKey(s) {
  const p = s.p;
  if (p.modal) return null;
  switch (p.screen) {
    case 'consent': return ['consent', t('consentSay', s.lang)];
    case 'interview': {
      const q = nextQ(p); if (!q) return null;
      const last = p.qhist[p.qhist.length - 1];
      let lead = '';
      if (last && QMAP[last].sec !== q.sec) lead = t('secIn_' + q.sec, s.lang) + ' ';
      else if (q.lead) lead = tx(q.lead, s.lang) + ' ';
      return ['q:' + q.id + ':' + p.qhist.length, lead + tx(q.t, s.lang)];
    }
    case 'testsIntro': return ['ti', t('testsSoon', s.lang)];
    case 'result': {
      const r = p.result; if (!r || p.status) return null;
      return ['res', (r.dominant ? t('mostly', s.lang, { z: t('za_' + r.dominant, s.lang) }) + ' ' : '') + t('triD_' + r.tri, s.lang)];
    }
  }
  return null;
}

/* ---------------- tests ---------------- */
export function startTests() {
  const p = P();
  const next = TESTS.find(k => !p.tests[k]);
  if (next) openTest(next); else finalize(); // compute the result, then show it
}

export function openTest(id) {
  setP({ cur: id, ts: initTest(id) });
  go('test');
}

function initTest(id) {
  switch (id) {
    case 'setup':    return { phase: 'card', w: Math.round(85.6 * 3.78), ok: false };
    case 'va':       return { eye: 'R', level: 0, trial: 0, dir: randDir(), best: -1, vaTmp: null };
    case 'contrast': return { level: 0, trial: 0, dir: randDir(), best: -1 };
    case 'near':     return { level: 0 };
    case 'np':       return { phase: 'ready', cm: 60 };
    case 'color':    return { i: 0, c: 0 };
    case 'amsler':   return { eye: 'R', marks: [], R: 0 };
    case 'astig':    return {};
    case 'pd':       return { phase: 'ready' };
    default:         return {};
  }
}

export function doneTest(id, result) {
  const tests = { ...P().tests, [id]: result };
  setP({ tests, cur: null, ts: null });
  const next = TESTS.find(k => !tests[k]);
  if (next) openTest(next); else finalize(); // compute the result, then show it
}

/* ---------------- demo controls ---------------- */
export function toggleOffline() {
  const off = !app.get().simOffline;
  app.set({ simOffline: off });
  if (off) { log('Connection lost: app keeps working offline', 'net'); toast(tt('nowOffline')); }
  else retryQueued();
}

export function toggleAuto() {
  const on = !app.get().autopilot;
  app.set({ autopilot: on });
  log(on ? 'Guided demo started: Ramappa, 55, farmer from Hosahalli, speaks Kannada' : 'Guided demo stopped');
}

export async function resetDemo() {
  stopSpeak();
  const cfg = await getConfig();
  if (cfg.mode === 'demo') await api('/events/reset', { method: 'POST' }).catch(() => {});
  await signOut('patient');
  app.set({ p: freshP(), log: [], lang: 'en', simOffline: false, autopilot: false });
}

/** Guided demo: plays Ramappa's journey. Returns a cancel function. */
export function scheduleAuto(s) {
  if (!s.autopilot) return null;
  const p = s.p;
  const G = (ms, fn) => setTimeout(() => app.get().autopilot && fn(), ms);
  if (p.modal === 'urgent') return G(3500, urgentClose);
  if (p.modal === 'login') {
    const Lg = p.login;
    if (!Lg || Lg.busy) return null;
    return G(1500, () => {
      if (Lg.step === 'phone') updateLogin({ phone: PERSONA.phone });
      else if (Lg.step === 'otp') { if (!Lg.demoCode) return; updateLogin({ otp: Lg.demoCode }); }
      else { const i = { en: 0, hi: 1, kn: 2 }[s.lang]; updateLogin({ name: PERSONA.name[i], village: PERSONA.village[i] }); }
      setTimeout(() => app.get().autopilot && P().modal === 'login' && loginNext(), 900);
    });
  }
  if (p.reply && p.screen !== 'messages') return G(2800, () => { setP({ unread: false }); go('messages'); });
  const qDelay = q => s.voiceOn ? Math.max(1900, Math.min(5000, tx(q.t, s.lang).length * 65)) : 1300;
  switch (p.screen) {
    case 'home': return G(2000, () => { if (s.lang !== 'kn') setLang('kn'); startMode('full'); });
    case 'consent': return G(3600, agree);
    case 'interview': {
      if (p.listening !== 'idle' || p.pick) return null;
      const q = nextQ(p); if (!q) return null;
      if ((q.type === 'multi' || q.type === 'scene') && p.multiSel && p.heard?.q === q.id) return G(1200, confirmMulti);
      return G(qDelay(q), startListen);
    }
    case 'testsIntro': return G(2400, finalize);
    case 'result':
      if (!p.status) return G(5000, openSend);
      if (p.status === 'sent' && !hinted) { hinted = true; toast('Open the optometrist portal in another tab to review this report'); }
      return null;
    case 'messages':
      if (p.reply && !p.autoPlayed) return G(900, () => { setP({ autoPlayed: true, unread: false }); playReply(); setTimeout(() => { app.set({ autopilot: false }); toast('Guided demo complete'); }, 9000); });
      return null;
  }
  return null;
}
let hinted = false;
