// Pupillary distance test (pd): the front camera measures the distance between the iris centres, scaled by the iris size
// (about 11.7 mm), so it does not need the camera's focal length. Result: { mm }, or {} when skipped or failed.
// The value is the near-viewing PD (the eyes converge on the camera), uncorrected; engine.js flags this for the optometrist.
import { useEffect, useRef, useState } from 'react';
import { Icon } from '../../lib/ui.jsx';
import CameraView from '../../camera/CameraView.jsx';
import { useCamera } from '../../camera/useCamera.js';
import { useFaceMeasure } from '../../camera/useFaceMeasure.js';
import { useTr } from '../../camera/useTr.js';
import { loadCameraScale } from '../../camera/calibration.js';
import { summarize, usableForPd } from '../../camera/geometry.js';

const NEED = 20;                  // good frames required
const TIMEOUT_MS = 10000;
const DIST_MM = [250, 600];       // wide on purpose: without calibration the distance is only good to about ±15%
const PD_MM = [40, 80];           // outside this, the measurement is treated as failed (agreed with the team)
const MAX_SPREAD_MM = 1.5;        // frame-to-frame scatter above this means the person moved

const HINT = { yaw: 'pdHintYaw', blink: 'pdHintBlink', small: 'pdHintCloser', far: 'pdHintCloser', near: 'pdHintFarther', clipped: 'pdHintClip', mismatch: 'pdHintClip' };

function hintFor(m) {
  if (!m) return null;
  if (m.distMm > DIST_MM[1]) return HINT.far;
  if (m.distMm < DIST_MM[0]) return HINT.near;
  const first = m.issues[0];
  return first ? HINT[first] : null;
}

export default function PupilDistance({ onDone }) {
  const tr = useTr();
  const [scale] = useState(() => loadCameraScale());
  const [phase, setPhase] = useState('ready'); // ready | measuring | done | fail
  const [count, setCount] = useState(0);
  const [res, setRes] = useState(null);
  const [failKey, setFailKey] = useState(null);
  const collecting = useRef(false);
  const samples = useRef([]);
  const rejects = useRef({});

  const cam = useCamera();
  const bump = k => { rejects.current[k] = (rejects.current[k] || 0) + 1; };

  function fail(key) { collecting.current = false; setFailKey(key); setPhase('fail'); }

  function conclude() {
    collecting.current = false;
    const s = summarize(samples.current);
    if (!s || s.n < NEED) return fail('pdFailTimeout');
    if (s.spread > MAX_SPREAD_MM) return fail('pdFailShaky');
    if (!(s.median >= PD_MM[0] && s.median <= PD_MM[1])) return fail('pdFailRange'); // never store an implausible PD
    setRes(Math.round(s.median * 2) / 2);   // the method is good to a few mm, so report to the nearest 0.5
    setPhase('done');
    cam.stop();
  }

  function onFrame(m) {
    if (!collecting.current) return;
    if (!m) { bump('noface'); return; }
    if (m.distMm < DIST_MM[0]) { bump('near'); return; }
    if (m.distMm > DIST_MM[1]) { bump('far'); return; }
    if (!usableForPd(m)) { m.issues.forEach(bump); return; }
    samples.current.push(m.pdMm);
    setCount(samples.current.length);
    if (samples.current.length >= NEED) conclude();
  }

  const fm = useFaceMeasure(cam, { fRel: scale.fRel, onFrame });

  useEffect(() => {
    if (phase !== 'measuring') return undefined;
    const id = setTimeout(() => {
      if (!collecting.current) return;
      const top = Object.entries(rejects.current).sort((a, b) => b[1] - a[1])[0]?.[0];
      fail(HINT[top] || 'pdFailTimeout');
    }, TIMEOUT_MS);
    return () => clearTimeout(id);
  }, [phase]); // eslint-disable-line react-hooks/exhaustive-deps

  function measure() { samples.current = []; rejects.current = {}; setCount(0); collecting.current = true; setPhase('measuring'); }
  function again() { collecting.current = false; setRes(null); setFailKey(null); setPhase('ready'); cam.start(); }

  const hint = fm.face && phase !== 'done' ? hintFor(fm.m) : null;
  return (
    <div>
      <div className="instr"><Icon n="eyes2" /><span>{tr('pdTitle')}</span></div>
      <p className="muted" style={{ marginTop: 10 }}>{tr('pdBody')}</p>

      <div style={{ display: phase === 'done' ? 'none' : 'block', marginTop: 12 }}>
        <CameraView cam={cam} fm={fm} chips={fm.m?.distMm ? [Math.round(fm.m.distMm / 10) + ' cm'] : []} />
      </div>

      {phase === 'measuring' && (
        <div style={{ marginTop: 12 }} role="status" aria-live="polite">
          <div className="gauge"><div className="trk" style={{ width: '100%' }}><i style={{ width: (count / NEED) * 100 + '%' }} /></div></div>
          <p className="muted small center">{tr('pdHold')}</p>
        </div>
      )}
      {hint && <p className="muted small center" role="status" style={{ marginTop: 10 }}>{tr(hint)}</p>}
      {phase === 'fail' && <p className="muted small center" role="status" style={{ marginTop: 10 }}>{tr(failKey)}</p>}

      {phase === 'done' && (
        <div className="lensc" style={{ marginTop: 14 }}>
          <span className="blob"><Icon n="eyes2" c="l" /></span>
          <div><b>{res.toFixed(1)} mm</b><p>{tr('pdRes')}</p><p className="xs">{tr('pdNote')}</p></div>
        </div>
      )}

      <div className="row" style={{ marginTop: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
        {phase === 'ready' && <button className="btn p" disabled={!fm.face} onClick={measure}>{tr('measure')}</button>}
        {phase === 'measuring' && <button className="btn p" disabled>{tr('measuring')}</button>}
        {phase === 'fail' && <button className="btn p" onClick={again}>{tr('camRetry')}</button>}
        {phase === 'done' && <>
          <button className="btn" onClick={again}>{tr('pdAgain')}</button>
          <button className="btn p" onClick={() => onDone({ mm: res })}>{tr('continue')} <Icon n="fwd" c="s" /></button>
        </>}
      </div>
      {phase !== 'done' && (
        <div className="center" style={{ marginTop: 10 }}>
          <button className="lnk" onClick={() => onDone({})}>{tr('camSkip')}</button>
        </div>
      )}
    </div>
  );
}
