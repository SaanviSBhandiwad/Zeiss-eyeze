// Run with: npm test
// The camera itself cannot be unit-tested, so these check the maths with synthetic faces whose true sizes are known.
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  IDX, IRIS_MM, analyzeFace, distanceMm, solveFRel, usableForDistance, usableForPd, median, summarize,
  irisDiameterPx, MAX_YAW_DEG,
} from './geometry.js';
import {
  DEFAULT_F_REL, isPlausibleFRel, loadCameraScale, saveCameraScale, clearCameraScale, cameraPxPerMm,
} from './calibration.js';

const near = (a, b, tol, msg) => assert.ok(Math.abs(a - b) <= tol, `${msg || ''} expected ${b} ± ${tol}, got ${a}`);

/**
 * Build 478 landmarks for a face with known pixel measurements on a w x h frame.
 * Offsets are laid out in pixels and only then normalised (x by w, y by h), exactly as MediaPipe reports them.
 */
function synthFace({
  w = 720, h = 1280, cx = 360, cy = 640, pdPx = 120, irisPx = 28, yaw = 0, roll = 0, open = 0.3, squashV = 1, rightScale = 1,
} = {}) {
  const lms = Array.from({ length: 478 }, () => ({ x: 0.5, y: 0.5, z: 0, visibility: 1 }));
  const rad = a => (a * Math.PI) / 180;
  const cosY = Math.cos(rad(yaw)), sinY = Math.sin(rad(yaw));
  const cosR = Math.cos(rad(roll)), sinR = Math.sin(rad(roll));
  // a point at (dx, dy) pixels from the face centre, before head turn and roll
  const put = (i, dx, dy, dz = 0) => {
    const x = dx * cosY, z = dz + dx * sinY;                 // yaw: x shrinks, depth changes
    const px = cx + x * cosR - dy * sinR, py = cy + x * sinR + dy * cosR;
    lms[i] = { x: px / w, y: py / h, z: z / w, visibility: 1 };
  };
  const eyeW = 0.48 * pdPx;
  const eyes = [
    { c: IDX.R_IRIS_CENTER, ring: IDX.R_IRIS_RING, ox: -pdPx / 2, outer: IDX.R_EYE_OUTER, inner: IDX.R_EYE_INNER, up: IDX.R_LID_UP, low: IDX.R_LID_LOW, outerSign: -1, s: rightScale },
    { c: IDX.L_IRIS_CENTER, ring: IDX.L_IRIS_RING, ox: +pdPx / 2, outer: IDX.L_EYE_OUTER, inner: IDX.L_EYE_INNER, up: IDX.L_LID_UP, low: IDX.L_LID_LOW, outerSign: +1, s: 1 },
  ];
  for (const e of eyes) {
    const r = (irisPx * e.s) / 2;
    put(e.c, e.ox, 0);
    // ring order is cyclic: left, top, right, bottom. squashV shrinks the vertical pair like an eyelid would.
    put(e.ring[0], e.ox - r, 0); put(e.ring[1], e.ox, -r * squashV);
    put(e.ring[2], e.ox + r, 0); put(e.ring[3], e.ox, +r * squashV);
    put(e.outer, e.ox + e.outerSign * eyeW / 2, 0); put(e.inner, e.ox - e.outerSign * eyeW / 2, 0);
    put(e.up, e.ox, -(open * eyeW) / 2); put(e.low, e.ox, +(open * eyeW) / 2);
  }
  return lms;
}

test('iris diameter in px is right on a portrait (non-square) frame', () => {
  const m = analyzeFace(synthFace({ irisPx: 28 }), 720, 1280);
  near(m.irisPx, 28, 0.01, 'irisPx');
  near(m.irisPxR, 28, 0.01); near(m.irisPxL, 28, 0.01);
});

test('x and y are scaled by their own frame dimension (a 720x1280 frame is not square)', () => {
  // A vertical-only ring pair: if y were scaled by the width the answer would be 0.5625 of the truth.
  const lms = synthFace({ irisPx: 40 });
  const ring = IDX.R_IRIS_RING;
  lms[ring[0]] = { ...lms[IDX.R_IRIS_CENTER] }; lms[ring[2]] = { ...lms[IDX.R_IRIS_CENTER] }; // collapse the horizontal pair
  near(irisDiameterPx(lms, ring, 720, 1280), 40, 0.01);
});

test('PD in mm comes from iris size, with no focal length needed', () => {
  // true face: PD 62 mm, iris 11.7 mm  => pdPx / irisPx = 62 / 11.7
  const irisPx = 26, pdPx = (62 / IRIS_MM) * irisPx;
  const m = analyzeFace(synthFace({ irisPx, pdPx }), 720, 1280);
  near(m.pdMm, 62, 0.05, 'pdMm');
  assert.equal(m.distMm, null); // no fRel supplied: no distance
});

test('PD is unchanged by head roll', () => {
  const base = analyzeFace(synthFace({ irisPx: 26, pdPx: 138 }), 720, 1280);
  const rolled = analyzeFace(synthFace({ irisPx: 26, pdPx: 138, roll: 25 }), 720, 1280);
  near(rolled.pdMm, base.pdMm, 0.05);
  near(rolled.rollDeg, 25, 0.5, 'rollDeg');
  assert.ok(usableForPd(rolled));
});

test('distance: pinhole maths, and solveFRel is its inverse', () => {
  const w = 720, h = 1280, fRel = 0.714;
  const f = fRel * 1280;                       // focal length in px
  const trueZ = 400;                           // mm
  const irisPx = (f * IRIS_MM) / trueZ;
  near(distanceMm(irisPx, w, h, fRel), trueZ, 0.01, 'distance');
  near(solveFRel(irisPx, trueZ, w, h), fRel, 1e-9, 'fRel');
  // the same physical setup at a different capture resolution gives the same fRel
  const s = 640 / 1280;
  near(solveFRel(irisPx * s, trueZ, w * s, h * s), fRel, 1e-9, 'fRel at half resolution');
});

test('distance through analyzeFace', () => {
  const fRel = 0.714, trueZ = 300;
  const irisPx = (fRel * 1280 * IRIS_MM) / trueZ;
  const m = analyzeFace(synthFace({ irisPx, pdPx: irisPx * 5.3 }), 720, 1280, { fRel });
  near(m.distMm, trueZ, 0.5);
});

test('bad inputs return null or null distance', () => {
  assert.equal(analyzeFace(null, 720, 1280), null);
  assert.equal(analyzeFace(synthFace().slice(0, 400), 720, 1280), null);
  assert.equal(analyzeFace(synthFace(), 0, 1280), null);
  assert.equal(distanceMm(0, 720, 1280, 0.7), null);
  assert.equal(solveFRel(20, 0, 720, 1280), null);
});

test('eyelid squeeze does not shrink the iris reading (larger pair wins)', () => {
  const open = analyzeFace(synthFace({ irisPx: 28 }), 720, 1280);
  const squint = analyzeFace(synthFace({ irisPx: 28, squashV: 0.6 }), 720, 1280);
  near(squint.irisPx, open.irisPx, 0.01);
});

test('yaw is measured without sign and gates PD', () => {
  const straight = analyzeFace(synthFace(), 720, 1280);
  near(straight.yawDeg, 0, 0.5);
  for (const yaw of [-20, 20]) {
    const m = analyzeFace(synthFace({ yaw }), 720, 1280);
    near(m.yawDeg, 20, 1.5, `yaw ${yaw}`);
    assert.ok(m.issues.includes('yaw'));
    assert.equal(usableForPd(m), false);
    assert.equal(usableForDistance(m), true, 'a turned head still gives a good iris size');
  }
  const ok = analyzeFace(synthFace({ yaw: MAX_YAW_DEG - 3 }), 720, 1280);
  assert.ok(!ok.issues.includes('yaw'));
});

test('a blink is flagged and not usable for PD', () => {
  const m = analyzeFace(synthFace({ open: 0.04 }), 720, 1280);
  assert.ok(m.issues.includes('blink'));
  assert.equal(usableForPd(m), false);
  assert.ok(analyzeFace(synthFace({ open: 0.3 }), 720, 1280).issues.length === 0);
});

test('a face at the frame edge is flagged as clipped', () => {
  const m = analyzeFace(synthFace({ cx: 20 }), 720, 1280);
  assert.ok(m.issues.includes('clipped'));
  assert.equal(usableForDistance(m), false);
});

test('a tiny iris is flagged as too small (face too far away)', () => {
  const m = analyzeFace(synthFace({ irisPx: 8, pdPx: 42 }), 720, 1280);
  assert.ok(m.issues.includes('small'));
});

test('irises of very different size are flagged as a bad fit', () => {
  const m = analyzeFace(synthFace({ irisPx: 28, rightScale: 0.6 }), 720, 1280);
  assert.ok(m.issues.includes('mismatch'));
});

test('median and summarize ignore outliers', () => {
  assert.equal(median([]), null);
  assert.equal(median([3, 1, 2]), 2);
  assert.equal(median([4, 1, 3, 2]), 2.5);
  const s = summarize([62, 62.2, 61.8, 62.1, 61.9, 95, NaN]);
  assert.equal(s.n, 6);
  near(s.median, 62.05, 0.1);
  assert.ok(s.spread < 0.5, 'a single outlier must not inflate the spread');
  assert.equal(summarize([]), null);
  assert.equal(summarize([NaN]), null);
});

/* ---- calibration storage ---- */
function memStorage() {
  const m = new Map();
  return { getItem: k => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: k => m.delete(k) };
}

test('calibration: default when nothing is saved', () => {
  const c = loadCameraScale(memStorage());
  assert.equal(c.source, 'default');
  assert.equal(c.fRel, DEFAULT_F_REL);
});

test('calibration: save, load, clear', () => {
  const s = memStorage();
  assert.equal(saveCameraScale({ fRel: 0.8, refMm: 300 }, s), true);
  const c = loadCameraScale(s);
  assert.equal(c.source, 'saved'); assert.equal(c.fRel, 0.8); assert.equal(c.refMm, 300);
  clearCameraScale(s);
  assert.equal(loadCameraScale(s).source, 'default');
});

test('calibration: implausible, corrupt or unavailable storage never breaks anything', () => {
  const s = memStorage();
  assert.equal(saveCameraScale({ fRel: 5 }, s), false);
  assert.equal(saveCameraScale({ fRel: NaN }, s), false);
  assert.equal(loadCameraScale(s).source, 'default');
  s.setItem('eyeze_camscale_v1', '{not json');
  assert.equal(loadCameraScale(s).source, 'default');
  s.setItem('eyeze_camscale_v1', JSON.stringify({ v: 1, fRel: 99 }));
  assert.equal(loadCameraScale(s).source, 'default');
  const broken = { getItem() { throw new Error('blocked'); }, setItem() { throw new Error('blocked'); }, removeItem() { throw new Error('blocked'); } };
  assert.equal(loadCameraScale(broken).source, 'default');
  assert.equal(saveCameraScale({ fRel: 0.8 }, broken), false);
  assert.doesNotThrow(() => clearCameraScale(broken));
  assert.equal(saveCameraScale({ fRel: 0.8 }, null), false);
});

test('calibration: plausibility range and px per mm', () => {
  assert.ok(isPlausibleFRel(DEFAULT_F_REL));
  assert.ok(!isPlausibleFRel(0.2) && !isPlausibleFRel(2) && !isPlausibleFRel(null));
  near(cameraPxPerMm(0.714, 720, 1280, 400), (0.714 * 1280) / 400, 1e-9);
  assert.equal(cameraPxPerMm(0.714, 720, 1280, 0), null);
});

import { recentMedian } from './geometry.js';
test('recentMedian: only the window, only kept frames, ignores non-finite', () => {
  const h = [{ t: 0, m: { d: 100 } }, { t: 900, m: { d: 400 } }, { t: 950, m: { d: 402 } }, { t: 980, m: { d: 9000, bad: true } }, { t: 990, m: { d: NaN } }];
  const r = recentMedian(h, 1000, 200, m => m.d, m => !m.bad);
  assert.equal(r.n, 2); assert.equal(r.value, 401);
  assert.deepEqual(recentMedian([], 1000, 200, m => m.d), { n: 0, value: null });
  assert.equal(recentMedian(h, 1000, 5000, m => m.d, m => !m.bad).n, 3);
});
