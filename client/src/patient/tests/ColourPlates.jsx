import { useEffect, useRef, useState } from 'react';
import { PLATES } from './constants.js';
import { mulberry } from './utils.jsx';

function drawPlate(canvas, plateIndex) {
  if (!canvas) return;
  let ctx;
  try { ctx = canvas.getContext('2d'); } catch { return; }
  if (!ctx) return;
  const pl = PLATES[plateIndex], W = 240;
  const off = document.createElement('canvas');
  off.width = W; off.height = W;
  let o;
  try { o = off.getContext('2d'); } catch { return; }
  if (!o) return;
  o.fillStyle = '#000';
  o.font = 'bold 140px Arial, Helvetica, sans-serif';
  o.textAlign = 'center';
  o.textBaseline = 'middle';
  o.fillText(String(pl.n), W / 2, W / 2 + 6);
  const m = o.getImageData(0, 0, W, W).data;
  const rnd = mulberry(pl.n * 977 + 13);
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, W, W);
  const fig = ['#d77d2e','#e4964a','#cc6a2b','#e8a45a','#d98b3c'];
  const gnd = ['#8fae4a','#9db95b','#7c9b3e','#a9c26c','#b4b45a'];
  for (let i = 0; i < 2400; i++) {
    const r = 2.2 + rnd() * 4.6, an = rnd() * Math.PI * 2, d = Math.sqrt(rnd()) * (W / 2 - 6);
    const x = W / 2 + Math.cos(an) * d, y = W / 2 + Math.sin(an) * d;
    const inF = m[((y | 0) * W + (x | 0)) * 4 + 3] > 100;
    const pal = inF ? fig : gnd;
    ctx.fillStyle = pal[(rnd() * pal.length) | 0];
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }
}

function PlateCanvas({ index }) {
  const ref = useRef(null);
  useEffect(() => { drawPlate(ref.current, index); }, [index]);
  return <canvas ref={ref} className="plate" width={240} height={240} aria-label="Colour plate" />;
}

export default function ColourPlates({ state, onDone }) {
  const [i, setI] = useState(state.i ?? 0);
  const [correct, setCorrect] = useState(state.c ?? 0);

  function onAns(v) {
    const c = String(PLATES[i].n) === String(v) ? correct + 1 : correct;
    const next = i + 1;
    if (next >= PLATES.length) { onDone({ c, n: PLATES.length }); return; }
    setCorrect(c);
    setI(next);
  }

  const pl = PLATES[i];
  return (
    <div>
      <div className="tcard">
        <span className="lv">Plate {i + 1} of {PLATES.length}</span>
        <PlateCanvas index={i} />
      </div>
      <div className="cnums">
        {pl.o.map(o => <button key={o} onClick={() => onAns(o)}>{o}</button>)}
      </div>
      <button className="btn w" style={{ marginTop: 10 }} onClick={() => onAns('none')}>No number</button>
    </div>
  );
}
