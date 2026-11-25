// CHILD MODE: tiny synthesized sound effects (no audio files). Silent when the header speaker is muted.
import { app } from '../state.js';

let ctx = null;
function play(notes, { type = 'sine', len = 0.12, gap = 0.09, vol = 0.12 } = {}) {
  if (!app.get().voiceOn) return;
  try {
    ctx ||= new (window.AudioContext || window.webkitAudioContext)();
    if (ctx.state === 'suspended') ctx.resume();
    let t = ctx.currentTime;
    for (const f of notes) {
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.type = type; o.frequency.value = f;
      g.gain.setValueAtTime(vol, t);
      g.gain.exponentialRampToValueAtTime(0.0001, t + len);
      o.connect(g).connect(ctx.destination);
      o.start(t); o.stop(t + len + 0.02);
      t += gap;
    }
  } catch { /* no audio: the game still works */ }
}

export const sfx = {
  coin: () => play([988, 1319], { type: 'square', len: 0.1, gap: 0.07, vol: 0.05 }),
  levelUp: () => play([523, 659, 784, 1047], { type: 'triangle', len: 0.16, gap: 0.1 }),
  soft: () => play([392, 330], { len: 0.14, gap: 0.12, vol: 0.07 }),
  lock: () => play([660, 880], { len: 0.1, gap: 0.08, vol: 0.07 }),
  win: () => play([523, 659, 784, 1047, 784, 1047], { type: 'triangle', len: 0.2, gap: 0.12 }),
  boop: () => play([262], { len: 0.08, vol: 0.05 }),
};
