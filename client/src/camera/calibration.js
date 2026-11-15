// The camera scale: how many pixels the front camera spends per mm at a given distance.
//
// The front camera cannot see the phone screen, so it cannot measure the screen's px/mm (that stays the card slider,
// setup.pxmm). What it can have is its own focal length, which turns "iris is d pixels wide" into "face is Z mm away".
// We store it as fRel = focal length in pixels / the frame's longer side. That ratio is the same at any capture
// resolution and in portrait or landscape, as long as the sensor crop does not change.
//
// This is kept on the device only (localStorage). It is NOT part of p.tests, so the agreed p.tests shape is unchanged.

export const DEFAULT_F_REL = 0.714;            // about a 70 degree field of view along the longer side, typical for phone front cameras
export const F_REL_RANGE = [0.45, 1.1];        // 106 to 49 degrees. Anything outside is treated as a bad calibration
export const DEFAULT_ACCURACY_NOTE = 'about ±15% without calibration';

const KEY = 'eyeze_camscale_v1';

export const isPlausibleFRel = f => Number.isFinite(f) && f >= F_REL_RANGE[0] && f <= F_REL_RANGE[1];

function safeStorage() {
  try { return globalThis.localStorage || null; } catch { return null; } // can throw in private mode or when blocked
}

/** The scale to use now: the saved calibration if there is a valid one, else the default. */
export function loadCameraScale(storage = safeStorage()) {
  try {
    const s = JSON.parse(storage?.getItem(KEY));
    if (s && s.v === 1 && isPlausibleFRel(s.fRel)) return { fRel: s.fRel, source: 'saved', refMm: s.refMm, savedAt: s.savedAt };
  } catch { /* missing or corrupt: fall through to the default */ }
  return { fRel: DEFAULT_F_REL, source: 'default' };
}

/** Saves a calibration. Returns false (and stores nothing) if the value is implausible or storage is unavailable. */
export function saveCameraScale({ fRel, refMm }, storage = safeStorage()) {
  if (!isPlausibleFRel(fRel)) return false;
  try {
    storage.setItem(KEY, JSON.stringify({ v: 1, fRel, refMm, savedAt: Date.now() }));
    return true;
  } catch { return false; }
}

export function clearCameraScale(storage = safeStorage()) {
  try { storage?.removeItem(KEY); } catch { /* ignore */ }
}

/** Camera pixels per mm on a plane distMm away, for a frame of w by h pixels. */
export function cameraPxPerMm(fRel, w, h, distMm) {
  return distMm > 0 ? (fRel * Math.max(w, h)) / distMm : null;
}
