// Run with: npm test   (Node's built-in test runner, no extra dependencies)
import test from 'node:test';
import assert from 'node:assert/strict';
import { cleanTests, computeResult, testRows } from './engine.js';
import { seedPatients } from './seed.js';

const ALL_KEYS = ['setup', 'va', 'near', 'np', 'contrast', 'color', 'amsler', 'astig', 'pd'];
const EMPTY_ALL = Object.fromEntries(ALL_KEYS.map(k => [k, {}]));
const person = (tests, age = 50) => ({ answers: { age, work: 'office' }, tests });

test('cleanTests: {} , null and non-objects count as not done', () => {
  assert.deepEqual(cleanTests(EMPTY_ALL), {});
  assert.deepEqual(cleanTests({ va: null, np: 5, pd: 'x', color: [] }), {});
  assert.deepEqual(cleanTests(undefined), {});
  assert.deepEqual(cleanTests(null), {});
});

test('cleanTests: keeps valid results of the agreed shape', () => {
  const t = {
    setup: { pxmm: 3.9 }, va: { R: 5, L: -1 }, near: { level: 4 }, np: { cm: 40, add: 1.25 },
    contrast: { pct: 12 }, color: { c: 3, n: 3 }, amsler: { R: 0, L: 2 },
    astig: { res: 'none' }, pd: { mm: 62.5 },
  };
  assert.deepEqual(cleanTests(t), t);
});

test('cleanTests: drops results with missing or non-finite fields', () => {
  const out = cleanTests({
    np: { cm: 40 }, pd: { mm: NaN }, va: { R: 3 }, astig: { res: 'possible' }, color: { c: '3', n: 3 },
  });
  assert.deepEqual(out, {});
});

test('cleanTests: astig needs an axis only when astigmatism is possible', () => {
  assert.ok(cleanTests({ astig: { res: 'none' } }).astig);
  assert.ok(cleanTests({ astig: { res: 'possible', clock: 6, axis: 180 } }).astig);
  assert.equal(cleanTests({ astig: { res: 'possible' } }).astig, undefined);
  assert.equal(cleanTests({ astig: { res: 'maybe' } }).astig, undefined);
});

test('cleanTests: accepts the older pd:{pd,conf} shape and exposes mm', () => {
  const out = cleanTests({ pd: { pd: 60.5, conf: 88 } });
  assert.deepEqual(out.pd, { pd: 60.5, conf: 88, mm: 60.5 });
});

test('cleanTests: does not mutate its input and keeps unknown non-empty keys', () => {
  const raw = { pd: { pd: 61 }, future: { x: 1 }, gone: {} };
  const copy = JSON.parse(JSON.stringify(raw));
  const out = cleanTests(raw);
  assert.deepEqual(raw, copy);
  assert.deepEqual(out.future, { x: 1 });
  assert.equal(out.gone, undefined);
});

test('computeResult: skipped tests ({}) give the same result as no tests', () => {
  const a = computeResult(person(EMPTY_ALL));
  const b = computeResult(person({}));
  assert.deepEqual(a, b);
});

test('computeResult: does not throw for any single skipped test', () => {
  for (const k of ALL_KEYS) assert.doesNotThrow(() => computeResult(person({ [k]: {} })), k);
});

test('computeResult: an np of {} adds no presbyopia flag, a real np does', () => {
  const none = computeResult(person({ np: {} }));
  assert.ok(!none.flags.some(f => f.startsWith('Presbyopia')));
  const real = computeResult(person({ np: { cm: 40, add: 1.25 } }));
  assert.ok(real.flags.includes('Presbyopia likely (blur at 40 cm, add ≈ +1.25)'));
});

test('testRows: every row is "not done" when all tests were skipped', () => {
  const rows = testRows(EMPTY_ALL, 'en');
  assert.equal(rows.length, 8);
  for (const r of rows) { assert.equal(r.st, 'na', r.k); assert.equal(r.v, '', r.k); }
});

test('testRows: pd uses the agreed {mm} shape', () => {
  const row = testRows({ pd: { mm: 62.46 } }, 'en').find(r => r.k === 'pd');
  assert.equal(row.v, '62.5 mm');
  assert.equal(row.st, 'good');
  assert.equal(row.conf, 72);
});

test('testRows: older pd:{pd,conf} still renders with its own confidence', () => {
  const row = testRows({ pd: { pd: 60.5, conf: 88 } }, 'en').find(r => r.k === 'pd');
  assert.equal(row.v, '60.5 mm');
  assert.equal(row.conf, 88);
});

test('testRows: pd {} is not done', () => {
  const row = testRows({ pd: {} }, 'en').find(r => r.k === 'pd');
  assert.equal(row.st, 'na');
  assert.equal(row.conf, 0);
});

test('seed patients: all produce a result and fully rendered test rows', () => {
  for (const p of seedPatients(Date.now())) {
    assert.doesNotThrow(() => computeResult(p), p.name);
    const rows = testRows(p.tests, 'en');
    for (const r of rows) assert.notEqual(r.st, 'na', `${p.name} ${r.k}`);
  }
});

import { nearAddFromCm } from './engine.js';
test('nearAddFromCm: prototype formula, rounded to 0.25 D and limited to 0..3', () => {
  const cases = [[60, 1.75], [50, 1.5], [40, 1.25], [30, 0.75], [25, 0.5], [20, 0], [10, 0]];
  for (const [cm, add] of cases) assert.equal(nearAddFromCm(cm), add, cm + ' cm');
  assert.ok(nearAddFromCm(1000) >= 0 && nearAddFromCm(1000) <= 3);
  assert.equal(nearAddFromCm(0), null);
  assert.equal(nearAddFromCm(NaN), null);
});

test('computeResult: a measured PD adds an uncorrected-near-PD flag; a skipped PD does not', () => {
  const withPd = computeResult(person({ pd: { mm: 62.5 } }));
  assert.ok(withPd.flags.some(f => f.includes('62.5 mm') && f.includes('not corrected for eye convergence')));
  assert.ok(!computeResult(person({ pd: {} })).flags.some(f => f.includes('PD')));
});

// ---- triage must reflect the tests the patient really did (regression: every patient came out "Urgent") ----
const GOOD = { va: { R: 6, L: 6 }, contrast: { pct: 3 }, color: { c: 3, n: 3 }, amsler: { R: 0, L: 0 }, astig: { res: 'none' } };

test('triage: a patient with normal results and no interview answers is routine (green), not urgent', () => {
  const r = computeResult({ answers: {}, tests: GOOD });
  assert.equal(r.tri, 'green');
  assert.deepEqual(r.reasons, []);
});

test('triage: "worse than 6/60 in both eyes" is the only test result that makes a report urgent on its own', () => {
  assert.equal(computeResult({ answers: {}, tests: { ...GOOD, va: { R: -1, L: -1 } } }).tri, 'red');
  assert.notEqual(computeResult({ answers: {}, tests: { ...GOOD, va: { R: -1, L: 4 } } }).tri, 'red');
  assert.equal(computeResult({ answers: {}, tests: { ...GOOD, contrast: { pct: 100 }, color: { c: 0, n: 3 }, amsler: { R: 5, L: 0 } } }).tri, 'amber');
});

test('triage: a red-flag answer that arrives as a lone string such as "none" is not spread into letters', () => {
  for (const a of [{ redflag: 'none' }, { cc_sudden: 'none' }, { redflag: ['none'] }, {}]) {
    assert.equal(computeResult({ answers: { age: 30, ...a }, tests: {} }).tri, 'green', JSON.stringify(a));
  }
  assert.equal(computeResult({ answers: { age: 30, redflag: ['flashes'] }, tests: {} }).tri, 'red');
  assert.equal(computeResult({ answers: { age: 30, redflag: 'flashes' }, tests: {} }).tri, 'red');
});

test('testRows: Hindi and Kannada patients see words, not a dash, for "no distortion" and "astigmatism not indicated"', () => {
  for (const lang of ['hi', 'kn']) {
    const by = Object.fromEntries(testRows({ amsler: { R: 0, L: 0 }, astig: { res: 'none' } }, lang).map(r => [r.k, r]));
    assert.ok(by.amsler.v.length > 1 && by.amsler.v !== '—', lang + ' amsler: ' + by.amsler.v);
    assert.ok(by.astig.v.length > 1 && by.astig.v !== '—', lang + ' astig: ' + by.astig.v);
    assert.equal(by.amsler.st, 'good'); assert.equal(by.astig.st, 'good');
  }
  const en = Object.fromEntries(testRows({ amsler: { R: 0, L: 0 }, astig: { res: 'none' } }, 'en').map(r => [r.k, r]));
  assert.equal(en.amsler.v, 'No distortion'); assert.equal(en.astig.v, 'Not indicated');
});

/* CHILD MODE */
test('child: answers.childAge alone switches to child triage (as the server and portal see the stored record)', () => {
  const r = computeResult({ answers: { childAge: '6-10', age: 8 }, tests: { va: { R: 4, L: 4 }, amsler: { R: 0, L: 0 } } });
  assert.equal(r.isChild, true);
  assert.equal(r.tri, 'green');
  // 6/12 is normal at 6-10 but would be "attention" under adult rules: confirm the age norm is applied
  assert.equal(computeResult({ answers: { childAge: '6-10' }, tests: { va: { R: 3, L: 4 } } }).tri, 'amber');
  assert.equal(computeResult({ answers: { childAge: '3-5' }, tests: { va: { R: 3, L: 3 } } }).tri, 'green');
});

test('child: 2+ lines between eyes, squint or eye turn is red', () => {
  assert.equal(computeResult({ answers: { childAge: '6-10' }, tests: { va: { R: 6, L: 4 } } }).tri, 'red');
  assert.equal(computeResult({ answers: { childAge: '3-5', sq_squint: 'yes' }, tests: {} }).tri, 'red');
  assert.equal(computeResult({ answers: { childAge: '3-5', sq_turn: 'yes' }, tests: {} }).tri, 'red');
});

test('child: an adult record without childAge is unaffected', () => {
  const a = computeResult({ answers: { age: 30 }, tests: { va: { R: 4, L: 4 } } });
  assert.notEqual(a.isChild, true);
  assert.equal(computeResult({ answers: { age: 30, childAge: 'bogus' }, tests: {} }).isChild, undefined);
});

test('child: uncamera-checked distance is flagged for the optometrist', () => {
  const r = computeResult({ answers: { childAge: '6-10' }, tests: { va: { R: 5, L: 5, distCm: null, distChecked: false } } });
  assert.ok(r.flags.some(f => f.includes('not camera-checked')));
});

test('child testRows: age norms, eye-gap check, only child tests listed', () => {
  const row = (tests, childAge) => testRows(tests, 'en', { childAge }).find(r => r.k === 'va');
  assert.equal(row({ va: { R: 4, L: 4 } }, '6-10').st, 'good');          // 6/12 normal at 6-10…
  assert.equal(row({ va: { R: 4, L: 4 } }).st, 'warn');                  // …but not for an adult
  assert.equal(row({ va: { R: 3, L: 3 } }, '3-5').st, 'good');
  assert.equal(row({ va: { R: 3, L: 3 } }, '6-10').st, 'warn');
  assert.equal(row({ va: { R: 6, L: 4 } }, '6-10').st, 'warn');          // both normal, but 2 lines apart
  assert.match(row({ va: { R: 5, L: 5, distCm: 41, distChecked: true } }, '6-10').v, /at 41 cm/);
  assert.deepEqual(testRows({ va: { R: 5, L: 5 }, amsler: { R: 0, L: 0 } }, 'en', { childAge: '3-5' }).map(r => r.k), ['va', 'amsler']);
  assert.equal(testRows({}, 'en', { childAge: 'bogus' }).length, 8);      // unknown band: adult table
});

test('child: normal screen suggests no glasses; anything else defers to an in-person exam', () => {
  assert.equal(computeResult({ answers: { childAge: '6-10' }, tests: { va: { R: 4, L: 4 } } }).lens, 'none');
  assert.equal(computeResult({ answers: { childAge: '6-10' }, tests: { va: { R: 3, L: 4 } } }).lens, 'defer');
});
