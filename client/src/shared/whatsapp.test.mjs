// Runs real conversations through the WhatsApp bot's own engine (whatsapp/src/engine.js), maps the answers with
// fromWhatsApp(), and checks that the app's triage engine reads them sensibly.
import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { computeResult, fromWhatsApp, waPhone, QMAP, visibleQs } from './index.js';

const require = createRequire(import.meta.url);
const { newSession, handle } = require('../../../whatsapp/src/engine.js');
const chat = msgs => { let s = newSession(); for (const m of msgs) s = handle(s, m).s; return s; };

// Same scripts as whatsapp/test/simulate.js
const ramappa = chat(['hi', '1', '1', 'Ramappa', '55', '1', '5', '3', '2', '2', '4', '3', '3', '3', '1', '1', '2,4', '1', '2', '3', '4', '5', '1']);
const student = chat(['hi', '1', '1', 'Ravi', '21', '4', '1', '4', '4', '1', '1', '1', '5', '3', '5', '4', '5', '1']);

test('WhatsApp → Eyeze: Ramappa (55, farmer, diabetic, readymade glasses)', () => {
  assert.ok(ramappa.done);
  const a = fromWhatsApp(ramappa.answers, { age: ramappa.age });
  assert.equal(a.age, 55); assert.equal(a.work, 'farming');
  assert.equal(a.glasses, 'yes'); assert.equal(a.glasses_src, 'market');
  assert.equal(a.outdoor, 8); assert.equal(a.night, 'glare'); assert.equal(a.drive, 'two');
  assert.ok(a.medical.includes('diabetes'));
  assert.equal(a.channel, 'whatsapp');
  const r = computeResult({ answers: a, tests: {} });
  assert.equal(r.tri, 'amber');                                              // diabetes, no eye exam
  assert.ok(r.reasons.some(x => x.startsWith('Diabetes')));
  assert.ok(r.flags.includes('Using readymade glasses from the market'));
  assert.ok(r.coat.includes('uv') && r.coat.includes('ar'));                 // outdoor 8 h, night glare
});

test('WhatsApp → Eyeze: student is routine; every mapped answer is a real app question/value', () => {
  const a = fromWhatsApp(student.answers, { age: student.age });
  assert.equal(computeResult({ answers: a, tests: {} }).tri, 'green');
  for (const [k, v] of Object.entries(a)) {
    if (k === 'channel') continue;
    const q = QMAP[k]; assert.ok(q, 'unknown question ' + k);
    if (q.o && q.type !== 'scene') for (const x of [].concat(v)) assert.ok(q.o.some(o => o.v === x), `${k}=${x} is not an app option`);
  }
  assert.doesNotThrow(() => visibleQs(a));
});

test('WhatsApp → Eyeze: red flag and extra symptoms', () => {
  const a = fromWhatsApp({ redflag: ['sudden', 'flash'], symptoms: ['double', 'strain'], difficulty: ['mid'] }, { age: 40 });
  assert.deepEqual(a.redflag, ['loss', 'flash']);
  assert.equal(computeResult({ answers: a, tests: {} }).tri, 'red');
  assert.match(a.note, /double vision/);
  assert.deepEqual(a.scene, ['cook', 'computer', 'counter']);
  assert.equal(a.cc, 'strain');
});

test('waPhone', () => {
  assert.equal(waPhone('whatsapp:+919845012345'), '+919845012345');
  assert.equal(waPhone('whatsapp:hello'), '');
});
