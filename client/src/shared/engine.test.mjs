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
