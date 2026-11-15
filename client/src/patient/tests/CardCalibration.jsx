import { useEffect, useState } from 'react';
import { Icon, Mascot } from '../../lib/ui.jsx';

export default function CardCalibration({ state, onDone }) {
  const [w, setW] = useState(state.w ?? Math.round(85.6 * 3.78));
  const [phase, setPhase] = useState(state.phase ?? 'card');
  const [ok, setOk] = useState(false);

  useEffect(() => {
    if (phase !== 'dist') return;
    const t = setTimeout(() => setOk(true), 2000);
    return () => clearTimeout(t);
  }, [phase]);

  if (phase === 'card') {
    return (
      <div className="tcard" style={{ padding: 16 }}>
        <p className="muted small">Resize until it matches a standard ID card (85.6 mm wide)</p>
        <div className="cardbox" style={{ width: w, maxWidth: '100%', height: 54, background: '#fff', border: '2px solid #ccc', borderRadius: 8, margin: '16px auto' }} />
        <input type="range" min={220} max={340} value={w} aria-label="Card width" style={{ width: '100%', marginTop: 8 }} onChange={e => setW(+e.target.value)} />
        <p className="xs muted center" style={{ marginTop: 6 }}>1 mm = {(w / 85.6).toFixed(2)} px</p>
        <div className="center" style={{ marginTop: 14 }}>
          <button className="btn p" onClick={() => setPhase('dist')}>Continue <Icon n="fwd" c="s" /></button>
        </div>
      </div>
    );
  }

  return (
    <div className="tcard" style={{ padding: 16 }}>
      <div className="cam" style={{ width: '100%', height: 180, background: '#e5e5e5', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span className="muted">Camera placeholder</span>
      </div>
      <p id="distok" style={{ minHeight: 24, marginTop: 8 }}>
        {ok && <span className="ok"><Icon n="check" c="s" /> Distance OK — 40 cm</span>}
      </p>
      <div className="center" style={{ marginTop: 14 }}>
        <button className="btn p" disabled={!ok} onClick={() => onDone({ pxmm: w / 85.6 })}>
          Continue <Icon n="fwd" c="s" />
        </button>
      </div>
    </div>
  );
}
