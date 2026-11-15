// Near point test (np): the person brings the phone slowly toward the face and taps when the words blur.
// The front camera measures the distance from iris size. Result: { cm, add }, or {} when skipped.
import { useEffect, useRef, useState } from 'react';
import { Icon } from '../../lib/ui.jsx';
import { nearAddFromCm } from '../../shared/index.js';
import { READ_LINES } from './constants.js';
import CameraView from '../../camera/CameraView.jsx';
import { useCamera } from '../../camera/useCamera.js';
import { useFaceMeasure } from '../../camera/useFaceMeasure.js';
import { useTr } from '../../camera/useTr.js';
import { loadCameraScale } from '../../camera/calibration.js';
import { recentMedian, usableForDistance } from '../../camera/geometry.js';

const WINDOW_MS = 600;       // smooth the reading over the last 0.6 s
const START_MIN_MM = 300;    // the test starts from about arm's length
const AUTO_STOP_CM = 15;     // closer than this, add is 0 anyway and the face is hard to track
const LOST_FINISH_CM = 22;   // face lost this close = it left the frame while approaching
const LOST_MS = 1200;
const MIN_CM = 8, MAX_CM = 100;

export default function NearPoint({ onDone }) {
  const tr = useTr();
  const [scale] = useState(() => loadCameraScale());
  const cam = useCamera();
  const fm = useFaceMeasure(cam, { fRel: scale.fRel });
  const [phase, setPhase] = useState('ready'); // ready | moving | done
  const [cm, setCm] = useState(null);
  const [res, setRes] = useState(null);
  const [msg, setMsg] = useState(null);
  const finished = useRef(false);
  const lastGood = useRef(null);

  const reading = () => recentMedian(fm.history.current, performance.now(), WINDOW_MS, m => m.distMm, usableForDistance);

  function finish(cmValue, kind) {
    if (finished.current) return;
    const c = Math.round(cmValue);
    if (!(c >= MIN_CM && c <= MAX_CM)) { setMsg('npBad'); setPhase('ready'); return; } // never store an implausible distance
    finished.current = true;
    setRes({ cm: c, add: nearAddFromCm(c), kind });
    setPhase('done');
    cam.stop();
  }

  useEffect(() => {
    if (phase !== 'moving') return undefined;
    lastGood.current = null;
    const iv = setInterval(() => {
      const r = reading(), now = performance.now();
      if (r.n >= 2) {
        const c = r.value / 10;
        setCm(c);
        lastGood.current = { cm: c, t: now };
        if (c <= AUTO_STOP_CM) finish(c, 'clear');
      } else {
        setCm(null);
        const g = lastGood.current;
        if (g && now - g.t > LOST_MS && g.cm <= LOST_FINISH_CM) finish(g.cm, 'clear');
      }
    }, 100);
    return () => clearInterval(iv);
  }, [phase]); // eslint-disable-line react-hooks/exhaustive-deps

  const canStart = !!fm.m && usableForDistance(fm.m) && fm.m.distMm >= START_MIN_MM;
  const tooClose = !!fm.m && usableForDistance(fm.m) && fm.m.distMm < START_MIN_MM;

  function start() { finished.current = false; setMsg(null); setCm(fm.m?.distMm ? fm.m.distMm / 10 : null); setPhase('moving'); }
  function blurry() {
    const r = reading();
    if (r.n < 2) { setMsg('npLost'); return; }   // no usable reading: say so, never guess
    setMsg(null);
    finish(r.value / 10, 'blur');
  }
  function again() { finished.current = false; setRes(null); setMsg(null); setCm(null); setPhase('ready'); cam.start(); }

  const pct = cm == null ? 0 : Math.max(0, Math.min(100, ((cm - 8) / 52) * 100));
  return (
    <div>
      <div className="instr"><Icon n="ruler" /><span>{tr('npTitle')}</span></div>
      <p className="muted" style={{ marginTop: 10 }}>{phase === 'ready' ? tr('npReady') : tr('npBody')}</p>

      <div style={{ display: phase === 'done' ? 'none' : 'block', maxWidth: 220, margin: '12px auto 0' }}>
        <CameraView cam={cam} fm={fm} chips={fm.m?.distMm ? [Math.round(fm.m.distMm / 10) + ' cm'] : []} />
      </div>

      <div className="tcard" style={{ marginTop: 12 }}>
        <div className="gauge">
          <span className="k">{tr('distNow')}</span>
          <b>{phase === 'done' ? res.cm : cm == null ? '—' : Math.round(cm)} cm</b>
          <div className="trk"><i style={{ width: (phase === 'done' ? Math.max(0, Math.min(100, ((res.cm - 8) / 52) * 100)) : pct) + '%' }} /></div>
          <p className="readtxt" style={{ fontSize: 15, marginTop: 10 }}>{READ_LINES[1]}</p>
          {phase === 'done' && (
            <>
              <span className="ok">{res.kind === 'blur' ? tr('npResult', { cm: res.cm }) : tr('npClear', { cm: res.cm })}</span>
              <p className="xs muted" style={{ marginTop: 8 }}>{tr('npAdd', { add: res.add.toFixed(2) })}</p>
            </>
          )}
        </div>
      </div>

      {msg && <p className="muted small center" role="status" style={{ marginTop: 10 }}>{tr(msg)}</p>}
      {phase === 'ready' && tooClose && <p className="muted small center" style={{ marginTop: 10 }}>{tr('npStartFar')}</p>}

      <div className="row" style={{ marginTop: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
        {phase === 'ready' && <button className="btn p" disabled={!canStart} onClick={start}>{tr('start')}</button>}
        {phase === 'moving' && <button className="btn g" onClick={blurry}>{tr('blurryNow')}</button>}
        {phase === 'done' && <>
          <button className="btn" onClick={again}>{tr('npAgain')}</button>
          <button className="btn p" onClick={() => onDone({ cm: res.cm, add: res.add })}>{tr('continue')} <Icon n="fwd" c="s" /></button>
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
