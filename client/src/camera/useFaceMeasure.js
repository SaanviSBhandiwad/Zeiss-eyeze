// Runs Face Landmarker on the live camera and turns each frame into measurements (see geometry.analyzeFace).
//
//   const cam = useCamera();
//   const fm  = useFaceMeasure(cam, { fRel, onFrame });
//
// fm.latest   ref: newest measurement, or null when no face is visible. Read it in your own timers or handlers.
// fm.history  ref: [{ t, m }] for roughly the last 4 s (frames with a face only), for smoothing and sample collection.
// fm.m        state: the newest measurement, refreshed about 8 times a second. Use it for display only.
// fm.face     state: whether a face is currently seen.
// fm.model    'loading' | 'ready' | 'error' (fm.modelError is a FaceModelError code).
// onFrame(m)  called for every analysed frame with the measurement, or null when no face. Use it to collect samples.
//
// Detection runs outside React's render cycle; only the display state above is throttled into React.
import { useEffect, useRef, useState } from 'react';
import { getFaceLandmarker, fallBackToCpu, frameTimestamp } from './faceLandmarker.js';
import { analyzeFace } from './geometry.js';

const MIN_INTERVAL_MS = 50;   // at most 20 analysed frames a second, to spare cheap phones
const HISTORY_MS = 4000;
const UI_INTERVAL_MS = 120;

export function useFaceMeasure(cam, { fRel, onFrame } = {}) {
  const latest = useRef(null);
  const history = useRef([]);
  const lmRef = useRef(null);
  const fRelRef = useRef(fRel);
  const onFrameRef = useRef(onFrame);
  const [retryTick, setRetryTick] = useState(0);
  const [ui, setUi] = useState({ model: 'loading', modelError: null, face: false, m: null, fps: 0 });

  useEffect(() => { fRelRef.current = fRel; onFrameRef.current = onFrame; });

  // Load the model as soon as the hook mounts, in parallel with the camera starting up.
  useEffect(() => {
    let dead = false;
    setUi(u => ({ ...u, model: 'loading', modelError: null }));
    getFaceLandmarker().then(lm => {
      if (dead) return;
      lmRef.current = lm;
      setUi(u => ({ ...u, model: 'ready' }));
    }).catch(e => {
      if (!dead) setUi(u => ({ ...u, model: 'error', modelError: e.code || 'init' }));
      console.error('[camera] face model failed:', e);
    });
    return () => { dead = true; };
  }, [retryTick]);

  const live = cam.status === 'live';
  useEffect(() => {
    latest.current = null;
    history.current = [];
    setUi(u => (u.face || u.m ? { ...u, face: false, m: null } : u));
    if (!live) return undefined;

    const v = cam.videoRef.current;
    if (!v) return undefined;
    let cancelled = false, handle = 0;
    let lastMediaTime = -1, lastRun = 0, lastUi = 0, lastFace = false, errors = 0, frames = 0, fpsT = performance.now(), fps = 0;

    const schedule = () => {
      handle = 'requestVideoFrameCallback' in v ? v.requestVideoFrameCallback(tick) : requestAnimationFrame(tick);
    };

    function tick(now, meta) {
      if (cancelled) return;
      schedule();
      const lm = lmRef.current;
      if (!lm || v.readyState < 2 || !v.videoWidth) return;
      const mediaTime = meta?.mediaTime ?? v.currentTime;
      if (mediaTime === lastMediaTime) return;   // same frame as last time
      lastMediaTime = mediaTime;
      if (now - lastRun < MIN_INTERVAL_MS) return;
      lastRun = now;

      let res;
      try {
        res = lm.detectForVideo(v, frameTimestamp());
        errors = 0;
      } catch (e) {
        // The GPU delegate can start fine and still fail on some phones. After a few failures switch to the CPU.
        console.error('[camera] detect failed:', e);
        if (++errors >= 3) {
          errors = 0;
          lmRef.current = null;
          fallBackToCpu();
          getFaceLandmarker().then(next => { if (!cancelled) lmRef.current = next; }).catch(() => {
            if (!cancelled) setUi(u => ({ ...u, model: 'error', modelError: 'init' }));
          });
        }
        return;
      }

      const lms = res?.faceLandmarks?.[0];
      const m = lms ? analyzeFace(lms, v.videoWidth, v.videoHeight, { fRel: fRelRef.current }) : null;
      if (m) {
        m.t = now;
        const h = history.current;
        h.push({ t: now, m });
        while (h.length && now - h[0].t > HISTORY_MS) h.shift();
      }
      latest.current = m;
      try { onFrameRef.current?.(m); } catch (e) { console.error('[camera] onFrame threw:', e); }

      frames++;
      if (now - fpsT >= 1000) { fps = Math.round((frames * 1000) / (now - fpsT)); frames = 0; fpsT = now; }
      const faceFlipped = !!m !== lastFace;   // show "face found / lost" at once, everything else at ~8 Hz
      if (now - lastUi >= UI_INTERVAL_MS || faceFlipped) {
        lastUi = now;
        lastFace = !!m;
        setUi(u => ({ ...u, face: !!m, m, fps }));
      }
    }

    schedule();
    return () => {
      cancelled = true;
      if ('cancelVideoFrameCallback' in v && handle) v.cancelVideoFrameCallback(handle); else cancelAnimationFrame(handle);
    };
  }, [live, cam.videoRef]);

  return {
    latest, history,
    model: ui.model, modelError: ui.modelError,
    face: ui.face, m: ui.m, fps: ui.fps,
    retryModel: () => setRetryTick(n => n + 1),
  };
}
