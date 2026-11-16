// Regression: the Landolt ring's drawn gap direction must match the answer button that is checked.
// (They were rotated 90 degrees apart, so every correct tap was scored wrong and everyone came out "worse than 6/60" = Urgent.)
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { DIRS } from './constants.js';
import { DIRS as ENGINE_DIRS } from '../../shared/engine.js';

// The ring is drawn with its gap on the +x side (right) at 0 degrees; SVG rotate() is clockwise with y pointing down.
const seen = deg => {
  const r = (deg * Math.PI) / 180, x = Math.cos(r), y = Math.sin(r);
  return Math.abs(x) > Math.abs(y) ? (x > 0 ? 'right' : 'left') : (y > 0 ? 'down' : 'up');
};

test('the ring is still drawn with its gap on the right at 0 degrees (the mapping below depends on it)', () => {
  const src = readFileSync(new URL('./utils.jsx', import.meta.url), 'utf8');
  assert.match(src, /<rect x="1\.3"/, 'LandoltRing gap moved: update DIRS in constants.js to match');
  assert.match(src, /DIRS\[dir\]/, 'LandoltRing must rotate by DIRS[dir]');
});

test('rotating the ring by DIRS[dir] makes the gap point to dir, for all four directions', () => {
  for (const dir of ['up', 'right', 'down', 'left']) assert.equal(seen(DIRS[dir]), dir, dir);
});

test('the patient tests and the shared engine agree on DIRS', () => {
  assert.deepEqual(DIRS, ENGINE_DIRS);
});
