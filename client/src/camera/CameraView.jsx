// Camera preview shared by the near-point, PD and setup tests.
//   const cam = useCamera();
//   const fm  = useFaceMeasure(cam, { fRel });
//   <CameraView cam={cam} fm={fm} chips={['38 cm']} />
// It shows the video, a clear message when the camera or the face model is not ready (with a Retry button),
// "show your face" when nobody is in view, and a privacy note. `chips` are small labels along the bottom of the video.
// Add ?camdebug=1 to the page URL to overlay the raw numbers and the detected irises, to check against a tape measure.
import { useEffect, useRef } from 'react';
import { t } from '../shared/index.js';
import { app } from '../patient/state.js';
import { useStore } from '../lib/store.js';
import { Icon } from '../lib/ui.jsx';

export const isCamDebug = () =>
  typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('camdebug') === '1';

const ERR_KEY = {
  denied: 'camDenied', nocamera: 'camNoCamera', busy: 'camBusy', insecure: 'camInsecure', unsupported: 'camUnsupported', failed: 'camFailed',
};

const fmt = (v, d = 1) => (Number.isFinite(v) ? v.toFixed(d) : '—');

export default function CameraView({ cam, fm, chips = [], debugInfo = '', debug = isCamDebug() }) {
  const lang = useStore(app, s => s.lang);
  const tr = k => t(k, lang);
  const canvasRef = useRef(null);
  const size = cam.size;
  const ratio = size ? size.w / size.h : 3 / 4;

  // What to say instead of the live view, if anything.
  let msg = null;
  if (cam.status === 'error') msg = { key: ERR_KEY[cam.error] || 'camFailed', retry: () => cam.start() };
  else if (fm.model === 'error') msg = { key: fm.modelError === 'network' ? 'camModelNet' : 'camModel', retry: fm.retryModel };
  else if (cam.status !== 'live') msg = { key: 'camStarting' };
  else if (fm.model === 'loading') msg = { key: 'camLoadingModel' };

  useEffect(() => {
    const c = canvasRef.current;
    if (!debug || !c || !size) return;
    c.width = size.w; c.height = size.h;
    const g = c.getContext('2d');
    if (!g) return; // debug overlay only; never let it break the test
    g.clearRect(0, 0, c.width, c.height);
    const m = fm.m;
    if (!m) return;
    g.lineWidth = Math.max(2, size.w / 360);
    g.strokeStyle = '#4ade80'; g.fillStyle = '#fbbf24';
    m.centers.forEach((p, i) => {
      const r = (i === 0 ? m.irisPxR : m.irisPxL) / 2;
      g.beginPath(); g.arc(p.x * size.w, p.y * size.h, r, 0, 2 * Math.PI); g.stroke();
      g.beginPath(); g.arc(p.x * size.w, p.y * size.h, g.lineWidth * 1.2, 0, 2 * Math.PI); g.fill();
    });
    g.beginPath();
    g.moveTo(m.centers[0].x * size.w, m.centers[0].y * size.h);
    g.lineTo(m.centers[1].x * size.w, m.centers[1].y * size.h);
    g.strokeStyle = '#fbbf24'; g.stroke();
  }, [debug, fm.m, size]);

  const m = fm.m;
  return (
    <div>
      <div
        className={'cam' + (cam.status === 'live' ? ' live' : '')}
        style={{ aspectRatio: ratio, width: `min(100%, ${68 * ratio}vh)`, margin: '0 auto' }}
      >
        <video ref={cam.videoRef} playsInline muted autoPlay aria-label={tr('camLive')} />
        {debug && <canvas ref={canvasRef} className="cdbg" aria-hidden="true" />}

        {msg && (
          <div className="cmsg" role="status" aria-live="polite">
            <p>{tr(msg.key)}</p>
            {msg.retry && <button className="btn sm" onClick={msg.retry}><Icon n="fwd" c="s" /> {tr('camRetry')}</button>}
          </div>
        )}

        {!msg && !fm.face && <div className="cmsg soft" role="status" aria-live="polite"><p>{tr('camNoFace')}</p></div>}
        {!msg && fm.face && chips.length > 0 && <div className="ov">{chips.map((c, i) => <span key={i}>{c}</span>)}</div>}

        {debug && (
          <pre className="cdbg-txt">
            {`frame ${size ? size.w + 'x' + size.h : '—'}  ${fm.fps} fps  model ${fm.model}\n`}
            {m
              ? `iris R ${fmt(m.irisPxR)} L ${fmt(m.irisPxL)} px (ratio ${fmt(m.irisRatio, 2)})\n` +
                `pd ${fmt(m.pdPx)} px = ${fmt(m.pdMm)} mm (raw)\n` +
                `dist ${fmt(m.distMm, 0)} mm\n` +
                `yaw ${fmt(m.yawDeg)}  roll ${fmt(m.rollDeg)}  eyeOpen ${fmt(m.eyeOpen, 2)}\n` +
                `issues: ${m.issues.join(', ') || 'none'}`
              : 'no face'}
            {debugInfo ? '\n' + debugInfo : ''}
          </pre>
        )}
      </div>
      <p className="xs muted center" style={{ marginTop: 8 }}>{tr('camPrivacy')}</p>
    </div>
  );
}
