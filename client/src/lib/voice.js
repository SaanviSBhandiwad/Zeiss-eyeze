// Voice: speaking questions (Sarvam TTS, cached on the server), recording answers
// (MediaRecorder → 16 kHz mono WAV), transcription (Sarvam STT) and clip upload (S3 presigned POST).
// When Sarvam isn't configured it falls back to the browser's speechSynthesis / SpeechRecognition.
import { LANGS } from '../shared/index.js';
import { api, absUrl, getConfig } from './api.js';
import { createStore } from './store.js';

/** speaking: drives the mascot animation. */
export const voiceState = createStore({ speaking: false });
const setSpeaking = on => voiceState.get().speaking !== on && voiceState.set({ speaking: on });

/* ---------------- speaking ---------------- */
let audio = null, speakToken = 0;
const ttsCache = new Map(); // lang|text -> url promise

export function stopSpeak() {
  speakToken++;
  if (audio) { audio.pause(); audio = null; }
  try { speechSynthesis.cancel(); } catch { /* unsupported */ }
  setSpeaking(false);
}

/** Speak text in lang. Resolves when finished (or interrupted). onNoVoice fires if nothing can speak it. */
export async function speak(text, lang, { onNoVoice } = {}) {
  if (!text) return;
  stopSpeak();
  const my = speakToken;
  const cfg = await getConfig();
  if (cfg.sarvam) {
    try {
      const k = lang + '|' + text;
      if (!ttsCache.has(k)) ttsCache.set(k, api('/voice/tts', { method: 'POST', body: { text, lang } }).then(r => absUrl(r.url)));
      const url = await ttsCache.get(k);
      if (my !== speakToken) return;
      return await playUrl(url, my);
    } catch {
      ttsCache.delete(lang + '|' + text);
      if (my !== speakToken) return;
    }
  }
  return browserSpeak(text, lang, my, onNoVoice);
}

/** Play an audio URL (voice reply, recorded answer). */
export function playUrl(url, my = ++speakToken) {
  return new Promise(resolve => {
    if (audio) audio.pause();
    const a = new Audio(url);
    audio = a;
    const done = () => { if (audio === a) { audio = null; setSpeaking(false); } resolve(); };
    a.onended = done; a.onerror = done; a.onpause = done;
    setSpeaking(true);
    a.play().catch(done);
    if (my !== speakToken) a.pause();
  });
}

function voices() { try { return speechSynthesis.getVoices() || []; } catch { return []; } }
if (typeof speechSynthesis !== 'undefined') { voices(); try { speechSynthesis.onvoiceschanged = voices; } catch { /* ignore */ } }

function browserSpeak(text, lang, my, onNoVoice) {
  return new Promise(resolve => {
    if (typeof speechSynthesis === 'undefined') { onNoVoice?.(); return resolve(); }
    const code = LANGS[lang].tts, vs = voices();
    const v = vs.find(x => x.lang === code) || vs.find(x => (x.lang || '').toLowerCase().replace('_', '-').startsWith(lang));
    if (!v && lang !== 'en') { onNoVoice?.(); return resolve(); }
    const u = new SpeechSynthesisUtterance(text);
    if (v) u.voice = v;
    u.lang = code; u.rate = 0.95;
    let done = false;
    const fin = () => { if (done) return; done = true; if (my === speakToken) setSpeaking(false); resolve(); };
    u.onend = fin; u.onerror = fin;
    setTimeout(fin, Math.min(20000, 2000 + text.length * 85));
    setSpeaking(true);
    try { speechSynthesis.speak(u); } catch { fin(); }
  });
}

/* ---------------- recording ---------------- */
export const canRecord = () => typeof MediaRecorder !== 'undefined' && !!navigator.mediaDevices?.getUserMedia;

/**
 * Start recording. Stops by itself after a pause in speech or maxMs.
 * Returns { stop() } ; onDone(wavBlob | null) is called once.
 */
export async function startRecording({ onDone, maxMs = 9000, onLevel } = {}) {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, channelCount: 1 } });
  const rec = new MediaRecorder(stream);
  const parts = [];
  rec.ondataavailable = e => e.data.size && parts.push(e.data);

  // crude voice-activity detection for auto-stop
  const ctx = new AudioContext();
  const an = ctx.createAnalyser(); an.fftSize = 1024;
  ctx.createMediaStreamSource(stream).connect(an);
  const buf = new Float32Array(an.fftSize);
  const t0 = Date.now(); let heard = false, quietSince = 0, stopped = false;
  const iv = setInterval(() => {
    an.getFloatTimeDomainData(buf);
    let s = 0; for (const x of buf) s += x * x;
    const rms = Math.sqrt(s / buf.length), now = Date.now();
    onLevel?.(rms);
    if (rms > 0.03) { heard = true; quietSince = 0; } else if (heard && !quietSince) quietSince = now;
    if ((heard && quietSince && now - quietSince > 1300) || now - t0 > maxMs || (!heard && now - t0 > 6000)) stop();
  }, 100);

  rec.onstop = async () => {
    clearInterval(iv);
    stream.getTracks().forEach(t => t.stop());
    ctx.close().catch(() => {});
    const blob = new Blob(parts, { type: rec.mimeType || 'audio/webm' });
    onDone?.(heard && blob.size ? await toWav(blob).catch(() => null) : null);
  };
  function stop() { if (stopped) return; stopped = true; if (rec.state !== 'inactive') rec.stop(); }
  rec.start();
  return { stop };
}

/** Decode whatever the browser recorded and re-encode as 16 kHz mono 16-bit WAV (small, universally supported). */
async function toWav(blob) {
  const raw = await blob.arrayBuffer();
  const dec = await new AudioContext().decodeAudioData(raw);
  const rate = 16000, len = Math.ceil(dec.duration * rate);
  const off = new OfflineAudioContext(1, len, rate);
  const src = off.createBufferSource(); src.buffer = dec; src.connect(off.destination); src.start();
  const pcm = (await off.startRendering()).getChannelData(0);
  const out = new DataView(new ArrayBuffer(44 + pcm.length * 2));
  const w = (o, s) => [...s].forEach((c, i) => out.setUint8(o + i, c.charCodeAt(0)));
  w(0, 'RIFF'); out.setUint32(4, 36 + pcm.length * 2, true); w(8, 'WAVE'); w(12, 'fmt ');
  out.setUint32(16, 16, true); out.setUint16(20, 1, true); out.setUint16(22, 1, true);
  out.setUint32(24, rate, true); out.setUint32(28, rate * 2, true); out.setUint16(32, 2, true); out.setUint16(34, 16, true);
  w(36, 'data'); out.setUint32(40, pcm.length * 2, true);
  for (let i = 0; i < pcm.length; i++) out.setInt16(44 + i * 2, Math.max(-1, Math.min(1, pcm[i])) * 0x7fff, true);
  return new Blob([out], { type: 'audio/wav' });
}

/** Sarvam STT through the server: { transcript, english }. */
export async function transcribe(wav, lang) {
  const fd = new FormData();
  fd.append('audio', wav, 'answer.wav');
  fd.append('lang', lang);
  return api('/voice/stt', { method: 'POST', form: fd });
}

/** Upload a recorded answer straight to storage. Returns the storage key, or null on failure. */
export async function uploadClip(wav, pid, qid) {
  try {
    const t = await api('/voice/upload', { method: 'POST', body: { pid, qid, contentType: 'audio/wav' } });
    if (t.method === 'POST') {
      const fd = new FormData();
      Object.entries(t.fields).forEach(([k, v]) => fd.append(k, v));
      fd.append('file', wav);
      const r = await fetch(t.url, { method: 'POST', body: fd });
      if (!r.ok) throw new Error('S3 upload failed');
    } else {
      const r = await fetch(absUrl(t.url), { method: 'PUT', headers: { 'Content-Type': 'audio/wav' }, body: wav });
      if (!r.ok) throw new Error('upload failed');
    }
    return t.key;
  } catch { return null; }
}

/* ---------------- browser fallback recognition ---------------- */
export const canBrowserRecognize = () => !!(window.SpeechRecognition || window.webkitSpeechRecognition);

/** Resolves with alternative transcripts, or null. */
export function browserRecognize(lang) {
  return new Promise(resolve => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return resolve(null);
    try {
      const r = new SR();
      r.lang = LANGS[lang].tts; r.interimResults = false; r.maxAlternatives = 4;
      let done = false; const fin = x => { if (!done) { done = true; resolve(x); } };
      r.onresult = e => { const alts = []; for (let i = 0; i < e.results[0].length; i++) alts.push(e.results[0][i].transcript); fin(alts); };
      r.onerror = () => fin(null); r.onend = () => fin(null);
      r.start();
    } catch { resolve(null); }
  });
}
