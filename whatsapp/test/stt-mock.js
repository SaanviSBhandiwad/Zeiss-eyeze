// Offline checks for spoken answers and the speech-to-text fallback chain. Run: node test/stt-mock.js
const assert = require('assert');
const { newSession, handle } = require('../src/engine');
const { transcribe } = require('../src/stt');

(async () => {
  // 1. Spoken answers become choices
  const cases = [
    ['occupation', 'four', 'student'], ['occupation', 'Student', 'student'], ['occupation', '4.', 'student'],
    ['occupation', 'number three', 'office'], ['occupation', 'चार', 'student'], ['occupation', 'ನಾಲ್ಕು', 'student'],
    ['occupation', 'ondu', 'farming'], ['occupation', '४', 'student'], ['occupation', 'for', 'student'],
  ];
  for (const [id, said, expect] of cases) {
    let s = newSession();
    for (const m of ['hi', '1', '1', 'Test', '30']) s = handle(s, m).s;
    s = handle(s, said).s;
    assert.strictEqual(s.answers[id], expect, `"${said}" should give ${expect}, got ${s.answers[id]}`);
  }
  console.log('✓ spoken answers ("four", "चार", "ನಾಲ್ಕು", "ondu", "number three") are understood');

  // multi-select by voice: "one and three"
  let s = newSession();
  for (const m of ['hi', '1', '1', 'Test', '30', '1', '1', '1', '1', '1', '1', '1', '1']) s = handle(s, m).s;
  console.log('  (now at question:', s.current + ')');

  // 2. Fallback chain: first two settings fail, third works
  const calls = [];
  const fake = (plan) => ({ recognize: async ({ config }) => { const step = calls.push(config); const r = plan[step - 1]; if (r instanceof Error) throw r; return [{ results: r }]; } });
  let text = await transcribe(fake([new Error('bad sample rate'), [], [{ alternatives: [{ transcript: 'four' }] }]]), Buffer.from('x'), 'audio/ogg; codecs=opus', 'en-IN', ['student']);
  assert.strictEqual(text, 'four'); assert.strictEqual(calls.length, 3);
  assert.strictEqual(calls[0].sampleRateHertz, 16000); assert.strictEqual(calls[1].sampleRateHertz, 48000);
  console.log('✓ fallback: error -> empty -> success returned "four" on attempt 3');

  // 3. Everything fails -> empty string (bot then asks the user to type)
  calls.length = 0;
  text = await transcribe(fake([new Error('a'), new Error('b'), new Error('c'), new Error('d')]), Buffer.from('x'), 'audio/ogg', 'kn-IN');
  assert.strictEqual(text, ''); console.log('✓ all attempts failing returns empty text without crashing');
})().catch(e => { console.error('FAILED:', e.message); process.exit(1); });