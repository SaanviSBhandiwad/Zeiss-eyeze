// Setup (first test): two scales.
//  1. Screen px per mm, from matching a bank/Aadhaar card on screen. This is the value stored as setup.pxmm. It stays the
//     fallback and always works, with or without a camera.
//  2. Optional camera check: coaches the person to about 40 cm, and can calibrate the front camera's scale against a 30 cm
//     ruler. That camera scale is kept on this device only (see camera/calibration.js), not in p.tests.
// Result: { pxmm }.
import { useEffect, useRef, useState } from 'react';
import { Icon } from '../../lib/ui.jsx';
import CameraView from '../../camera/CameraView.jsx';
import { useCamera } from '../../camera/useCamera.js';
import { useFaceMeasure } from '../../camera/useFaceMeasure.js';
import { useTr } from '../../camera/useTr.js';
import { loadCameraScale, saveCameraScale } from '../../camera/calibration.js';
import { MAX_YAW_DEG, solveFRel, summarize, usableForDistance } from '../../camera/geometry.js';

// ISO/IEC 7810 ID-1 (bank cards, Aadhaar PVC card): 85.60 x 53.98 mm. We match the SHORT side: the long side is wider
// than most phone screens, and phones show about 6 CSS px per mm, which the old 220-340 px slider could never reach.
export const CARD_SHORT_MM = 53.98;
const PXMM_RANGE = [2, 12];
const REF_MM = 300;            // calibration distance: a 30 cm ruler, or the long side of A4 (297 mm)
const NEED = 20, TIMEOUT_MS = 8000, MAX_REL_SPREAD = 0.05;
const GOOD_MM = [350, 450];    // "about 40 cm"

const guessPxPerMm = () =>
  (typeof matchMedia === 'function' && matchMedia('(pointer: coarse)').matches ? 6 : 3.78);

function CamStep({ onContinue }) {
  const tr = useTr();
  const [scale, setScale] = useState(() => loadCameraScale());
  const [mode, setMode] = useState('check');   // check | ref
  const [busy, setBusy] = useState(false);
  const [count, setCount] = useState(0);
  const [note, setNote] = useState(null);      // { key, good }
  const collecting = useRef(false), samples = useRef([]), frame = useRef(null);
  const cam = useCamera();

  function conclude() {
    collecting.current = false; setBusy(false);
    const s = summarize(samples.current);
    if (!s || s.n < NEED) return setNote({ key: 'pdFailTimeout' });
    if (s.spread / s.median > MAX_REL_SPREAD) return setNote({ key: 'pdFailShaky' });
    const fRel = solveFRel(s.median, REF_MM, frame.current.w, frame.current.h);
    if (!saveCameraScale({ fRel, refMm: REF_MM })) return setNote({ key: 'setupRefBad' }); // implausible: nothing is saved
    setScale(loadCameraScale());
    setNote({ key: 'setupRefOk', good: true });
    setMode('check');
  }

  function onFrame(m) {
    if (!collecting.current || !m || !usableForDistance(m) || m.yawDeg > MAX_YAW_DEG) return;
    samples.current.push(m.irisPx);
    frame.current = { w: m.w, h: m.h };
    setCount(samples.current.length);
    if (samples.current.length >= NEED) conclude();
  }

  const fm = useFaceMeasure(cam, { fRel: scale.fRel, onFrame });

  useEffect(() => {
    if (!busy) return undefined;
    const id = setTimeout(() => { if (collecting.current) { collecting.current = false; setBusy(false); setNote({ key: 'pdFailTimeout' }); } }, TIMEOUT_MS);
    return () => clearTimeout(id);
  }, [busy]);

  function calibrate() { samples.current = []; setCount(0); setNote(null); collecting.current = true; setBusy(true); }

  const m = fm.m, clean = !!m && usableForDistance(m);
  const inRange = clean && m.distMm >= GOOD_MM[0] && m.distMm <= GOOD_MM[1];
  const hint = mode === 'check' && clean && !inRange ? (m.distMm < GOOD_MM[0] ? 'setupFarther' : 'setupCloser') : null;

  return (
    <div>
      <div className="instr"><Icon n="card" /><span>{tr(mode === 'ref' ? 'setupRefBtn' : 'distTitle')}</span></div>
      <p className="muted" style={{ marginTop: 10 }}>{tr(mode === 'ref' ? 'setupRefBody' : 'distBody')}</p>
      <div style={{ marginTop: 12 }}>
        <CameraView cam={cam} fm={fm} chips={m?.distMm ? [Math.round(m.distMm / 10) + ' cm'] : []}
          debugInfo={`fRel ${scale.fRel.toFixed(3)} (${scale.source})`} />
      </div>
      <p className="center" style={{ minHeight: 28, marginTop: 8 }}>
        {mode === 'check' && inRange && <span className="ok"><Icon n="check" c="s" /> {tr('distOk')}</span>}
      </p>
      {hint && <p className="muted small center" role="status">{tr(hint)}</p>}
      {note && <p className={'small center ' + (note.good ? '' : 'muted')} role="status">{tr(note.key)}</p>}
      <p className="xs muted center">{tr(scale.source === 'saved' ? 'setupScaleSaved' : 'setupScaleDefault')}</p>

      {busy && <div className="gauge" style={{ marginTop: 8 }}><div className="trk" style={{ width: '100%' }}><i style={{ width: (count / NEED) * 100 + '%' }} /></div></div>}

      <div className="row" style={{ marginTop: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
        {mode === 'check' && <>
          <button className="btn p" disabled={!inRange} onClick={onContinue}>{tr('continue')} <Icon n="fwd" c="s" /></button>
          <button className="btn" onClick={() => { setNote(null); setMode('ref'); }}>{tr('setupRefBtn')}</button>
        </>}
        {mode === 'ref' && <>
          <button className="btn" disabled={busy} onClick={() => { collecting.current = false; setMode('check'); }}>{tr('back')}</button>
          <button className="btn p" disabled={busy || !clean || m.yawDeg > MAX_YAW_DEG} onClick={calibrate}>{tr('setupCalibrate')}</button>
        </>}
      </div>
      {mode === 'check' && !inRange && (
        <div className="center" style={{ marginTop: 10 }}>
          <button className="lnk" onClick={onContinue}>{tr('setupNoCam')}</button>
        </div>
      )}
    </div>
  );
}

export default function SetupCalibration({ onDone }) {
  const tr = useTr();
  const [phase, setPhase] = useState('card');
  const [w, setW] = useState(() => Math.round(CARD_SHORT_MM * guessPxPerMm()));
  const [maxW, setMaxW] = useState(400);
  const boxRef = useRef(null);

  // The bar must be drawn at exactly w px, so the slider can never go wider than the space available.
  useEffect(() => {
    const el = boxRef.current;
    if (!el) return undefined;
    const measure = () => { if (el.clientWidth > 0) { const mx = Math.max(110, el.clientWidth - 32); setMaxW(mx); setW(x => Math.min(x, mx)); } };
    measure();
    if (typeof ResizeObserver === 'undefined') return undefined;
    const ro = new ResizeObserver(measure); ro.observe(el);
    return () => ro.disconnect();
  }, [phase]);

  const pxmm = Math.round((w / CARD_SHORT_MM) * 1000) / 1000;
  const valid = pxmm >= PXMM_RANGE[0] && pxmm <= PXMM_RANGE[1];
  const finish = () => onDone({ pxmm });

  if (phase === 'card') {
    return (
      <div ref={boxRef} className="tcard" style={{ padding: 16, display: 'block' }}>
        <div className="instr" style={{ marginTop: 0 }}><Icon n="card" /><span>{tr('calib2Title')}</span></div>
        <p className="muted small" style={{ marginTop: 8 }}>{tr('calib2Body')}</p>
        <div aria-hidden="true" style={{ width: w, maxWidth: '100%', height: 56, margin: '16px auto', border: '2.5px dashed #0f766e', borderRadius: 12, background: 'linear-gradient(135deg,#e3f6f2,#c8ebe4)', display: 'grid', placeItems: 'center', color: '#0f766e', fontWeight: 700, fontSize: 13 }}>54 mm</div>
        <input type="range" min={Math.ceil(PXMM_RANGE[0] * CARD_SHORT_MM)} max={Math.max(maxW, Math.ceil(PXMM_RANGE[0] * CARD_SHORT_MM))} value={w} aria-label="Card width" style={{ width: '100%', marginTop: 8 }} onChange={e => setW(+e.target.value)} />
        <p className="xs muted center" style={{ marginTop: 6 }}>1 mm = {pxmm.toFixed(2)} px</p>
        <div className="center" style={{ marginTop: 14 }}>
          <button className="btn p" disabled={!valid} onClick={() => setPhase('cam')}>{tr('continue')} <Icon n="fwd" c="s" /></button>
        </div>
      </div>
    );
  }
  return <CamStep onContinue={finish} />;
}
