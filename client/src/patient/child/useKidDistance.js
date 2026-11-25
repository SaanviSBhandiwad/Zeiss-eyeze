// CHILD MODE: keeps the child at the test distance (about 40 cm, same target as the adult setup step)
// using the front camera's iris size. Reuses the adult camera pipeline (camera/useCamera + useFaceMeasure).
//
// mode 'camera': live reading; `ok` is true only while the smoothed distance is in range.
// mode 'manual': no camera (denied, unsupported, model failed, or "play without camera"); `ok` is always true and
//                the result is marked as not distance-checked so the optometrist knows.
import { useEffect, useRef, useState } from 'react';
import { useCamera } from '../../camera/useCamera.js';
import { useFaceMeasure } from '../../camera/useFaceMeasure.js';
import { loadCameraScale } from '../../camera/calibration.js';
import { median, recentMedian, usableForDistance } from '../../camera/geometry.js';

export const TARGET_CM = 40;
const ENTER_MM = [350, 450];   // must get inside this band to start…
const STAY_MM = [320, 480];    // …and may drift a little before the game pauses again (hysteresis, so it doesn't flicker)
const WINDOW_MS = 600;

export function useKidDistance() {
  const [scale] = useState(() => loadCameraScale());
  const cam = useCamera();
  const fm = useFaceMeasure(cam, { fRel: scale.fRel });
  const [mm, setMm] = useState(null);
  const [inRange, setInRange] = useState(false);
  const [manual, setManual] = useState(false);
  const log = useRef([]); // distances (mm) at each answer, for the report

  useEffect(() => {
    const iv = setInterval(() => {
      const r = recentMedian(fm.history.current, performance.now(), WINDOW_MS, m => m.distMm, usableForDistance);
      const v = r.n >= 2 ? r.value : null;
      setMm(v);
      setInRange(was => v != null && (was ? v >= STAY_MM[0] && v <= STAY_MM[1] : v >= ENTER_MM[0] && v <= ENTER_MM[1]));
    }, 150);
    return () => clearInterval(iv);
  }, [fm.history]);

  const failed = cam.status === 'error' || fm.model === 'error';
  const mode = manual || failed ? 'manual' : 'camera';
  const loading = mode === 'camera' && (cam.status !== 'live' || fm.model !== 'ready');
  const zone = mm == null ? 'none' : mm < ENTER_MM[0] ? 'close' : mm > ENTER_MM[1] ? 'far' : 'ok';

  return {
    cam, mode, loading, mm, zone,
    ok: mode === 'manual' || inRange,
    calibrated: scale.source === 'saved',
    playWithoutCamera: () => { setManual(true); cam.stop(); },
    /** Call on every answer: remembers the distance it was given at. */
    mark: () => { if (mode === 'camera' && mm) log.current.push(mm); },
    /** Summary for the result: { cm, checked } (cm is the median answering distance). */
    summary: () => {
      const m = median(log.current);
      return mode === 'camera' && m ? { cm: Math.round(m / 10), checked: true } : { cm: null, checked: false };
    },
  };
}
