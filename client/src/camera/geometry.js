// Pure geometry for iris-based face measurements (near-point distance, pupillary distance).
// No DOM and no browser APIs, so it is unit-tested in Node (geometry.test.mjs).
//
// Input is MediaPipe Face Landmarker output: 478 landmarks with x and y normalised to the frame
// (x by width, y by height) and z on roughly the same scale as x. Every pixel distance below
// multiplies x by the frame width and y by the frame height. Mixing those up is the classic bug
// on portrait video, which is why width and height are explicit arguments everywhere.

/** Landmark indices (verified against FaceLandmarker.FACE_LANDMARKS_*_IRIS / _EYE in @mediapipe/tasks-vision). */
export const IDX = {
  // "R" / "L" are the person's right and left eye. In an unmirrored frame the right eye is on the image's left.
  R_IRIS_CENTER: 468, R_IRIS_RING: [469, 470, 471, 472], // ring is cyclic: opposite points are [0]-[2] and [1]-[3]
  L_IRIS_CENTER: 473, L_IRIS_RING: [474, 475, 476, 477],
  R_EYE_OUTER: 33, R_EYE_INNER: 133, R_LID_UP: 159, R_LID_LOW: 145,
  L_EYE_OUTER: 263, L_EYE_INNER: 362, L_LID_UP: 386, L_LID_LOW: 374,
};

/** Average horizontal visible iris diameter of adults, in mm. Varies by roughly ±0.5 mm between people (about ±4%). */
export const IRIS_MM = 11.7;

/* Quality gates. These are starting values to be tuned on real phones with ?camdebug=1. */
export const MAX_YAW_DEG = 10;      // PD is read along the image x axis, so the head must face the camera
export const MIN_EYE_OPEN = 0.14;   // lid gap / eye width. Open eyes read roughly 0.25 to 0.35, a blink drops below 0.1
export const MIN_IRIS_PX = 12;      // a smaller iris is too coarse for a trustworthy scale
export const EDGE_MARGIN = 0.02;    // iris or eye landmark closer than 2% to the frame edge counts as clipped
export const IRIS_RATIO_RANGE = [0.8, 1.25]; // the two irises should come out about the same size

const RAD = 180 / Math.PI;

const dist2 = (a, b, w, h) => Math.hypot((a.x - b.x) * w, (a.y - b.y) * h);

/** Iris diameter in pixels. Uses the larger of the two opposite-point pairs: eyelids shrink the vertical pair,
 *  a turned head shrinks the horizontal pair, and the larger one is the least affected by either. */
export function irisDiameterPx(lms, ring, w, h) {
  return Math.max(dist2(lms[ring[0]], lms[ring[2]], w, h), dist2(lms[ring[1]], lms[ring[3]], w, h));
}

/** Lid gap divided by eye width. Near 0 means the eye is closed. */
export function eyeOpenRatio(lms, outer, inner, up, low, w, h) {
  const width = dist2(lms[outer], lms[inner], w, h);
  return width > 0 ? dist2(lms[up], lms[low], w, h) / width : 0;
}

/** Absolute head turn (yaw) in degrees, from the depth difference between the two outer eye corners.
 *  Sign-free on purpose: only "how far from facing the camera" matters. */
export function yawDeg(lms, w, h) {
  const a = lms[IDX.R_EYE_OUTER], b = lms[IDX.L_EYE_OUTER];
  const dx = Math.abs(b.x - a.x) * w, dz = Math.abs(b.z - a.z) * w;
  return Math.atan2(dz, dx) * RAD;
}

/** Tilt of the line between the irises, in degrees (-90 to 90). Distances are roll-invariant, this is for display. */
export function rollDeg(lms, w, h) {
  const a = lms[IDX.R_IRIS_CENTER], b = lms[IDX.L_IRIS_CENTER];
  let d = Math.atan2((b.y - a.y) * h, (b.x - a.x) * w) * RAD;
  if (d > 90) d -= 180; else if (d < -90) d += 180;
  return d;
}

/** Pinhole distance from the camera to the iris plane, in mm: Z = f * D / d.
 *  fRel is the focal length in pixels divided by the frame's longer side (see calibration.js). */
export function distanceMm(irisPx, w, h, fRel) {
  if (!(irisPx > 0) || !(fRel > 0)) return null;
  return (fRel * Math.max(w, h) * IRIS_MM) / irisPx;
}

/** Inverse of distanceMm: the fRel that makes an iris of irisPx pixels read as knownMm. */
export function solveFRel(irisPx, knownMm, w, h) {
  if (!(irisPx > 0) || !(knownMm > 0)) return null;
  return (irisPx * knownMm) / (IRIS_MM * Math.max(w, h));
}

const EDGE_IDX = [
  ...IDX.R_IRIS_RING, ...IDX.L_IRIS_RING, IDX.R_IRIS_CENTER, IDX.L_IRIS_CENTER,
  IDX.R_EYE_OUTER, IDX.R_EYE_INNER, IDX.L_EYE_OUTER, IDX.L_EYE_INNER,
];

/**
 * One frame's measurements from one face. Returns null when the landmarks are unusable.
 * `issues` lists why this frame should not be trusted for a given purpose (see usableForDistance / usableForPd).
 * pdMm is the iris-centre separation scaled by the iris size, so it does not need the camera's focal length.
 */
export function analyzeFace(lms, w, h, { fRel } = {}) {
  if (!lms || lms.length < 478 || !(w > 0) || !(h > 0)) return null;
  const dR = irisDiameterPx(lms, IDX.R_IRIS_RING, w, h);
  const dL = irisDiameterPx(lms, IDX.L_IRIS_RING, w, h);
  if (!(dR > 0) || !(dL > 0)) return null;
  const irisPx = (dR + dL) / 2;
  const pdPx = dist2(lms[IDX.R_IRIS_CENTER], lms[IDX.L_IRIS_CENTER], w, h);
  const eyeOpen = Math.min(
    eyeOpenRatio(lms, IDX.R_EYE_OUTER, IDX.R_EYE_INNER, IDX.R_LID_UP, IDX.R_LID_LOW, w, h),
    eyeOpenRatio(lms, IDX.L_EYE_OUTER, IDX.L_EYE_INNER, IDX.L_LID_UP, IDX.L_LID_LOW, w, h),
  );
  const yaw = yawDeg(lms, w, h);
  const ratio = dR / dL;
  const clipped = EDGE_IDX.some(i => {
    const p = lms[i];
    return p.x < EDGE_MARGIN || p.x > 1 - EDGE_MARGIN || p.y < EDGE_MARGIN || p.y > 1 - EDGE_MARGIN;
  });

  const issues = [];
  if (clipped) issues.push('clipped');
  if (irisPx < MIN_IRIS_PX) issues.push('small');
  if (ratio < IRIS_RATIO_RANGE[0] || ratio > IRIS_RATIO_RANGE[1]) issues.push('mismatch');
  if (eyeOpen < MIN_EYE_OPEN) issues.push('blink');
  if (yaw > MAX_YAW_DEG) issues.push('yaw');

  return {
    w, h,
    irisPx, irisPxR: dR, irisPxL: dL, irisRatio: ratio,
    pdPx,
    pdMm: (pdPx * IRIS_MM) / irisPx,
    distMm: fRel ? distanceMm(irisPx, w, h, fRel) : null,
    eyeOpen, yawDeg: yaw, rollDeg: rollDeg(lms, w, h),
    centers: [lms[IDX.R_IRIS_CENTER], lms[IDX.L_IRIS_CENTER]],
    issues,
  };
}

/** Distance needs both irises measured cleanly. Blinks and head turn matter less (the iris size barely changes), so they are allowed. */
export const usableForDistance = m => !!m && !m.issues.some(i => i === 'clipped' || i === 'small' || i === 'mismatch');
/** PD additionally needs open eyes and a head that faces the camera. */
export const usableForPd = m => !!m && m.issues.length === 0;

/* ---- robust statistics ---- */

export function median(values) {
  if (!values.length) return null;
  const s = [...values].sort((a, b) => a - b), n = s.length;
  return n % 2 ? s[(n - 1) / 2] : (s[n / 2 - 1] + s[n / 2]) / 2;
}

/** Median and a spread estimate (median absolute deviation scaled to match a standard deviation). Null for no samples. */
export function summarize(values) {
  const clean = values.filter(Number.isFinite);
  if (!clean.length) return null;
  const m = median(clean);
  return { n: clean.length, median: m, spread: 1.4826 * median(clean.map(v => Math.abs(v - m))) };
}
