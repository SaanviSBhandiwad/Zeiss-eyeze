import { useState } from 'react';
import { Icon } from '../../lib/ui.jsx';
import { CONTRAST } from './constants.js';
import { LandoltRing, randDir } from './utils.jsx';

export default function ContrastTest({ state, onDone }) {
  const [level, setLevel] = useState(state.level ?? 0);
  const [dir, setDir] = useState(state.dir ?? randDir());
  const [best, setBest] = useState(state.best ?? -1);

  function onAns(d) {
    if (d === 'cant') {
      onDone({ pct: best < 0 ? 100 : CONTRAST[best] });
      return;
    }
    if (d === dir) {
      const newBest = level;
      if (level >= CONTRAST.length - 1) { onDone({ pct: CONTRAST[newBest] }); return; }
      setBest(newBest);
      setLevel(l => l + 1);
      setDir(randDir());
    } else {
      onDone({ pct: best < 0 ? 100 : CONTRAST[best] });
    }
  }

  return (
    <div>
      <div className="tcard">
        <span className="lv">{CONTRAST[level]}%</span>
        <LandoltRing dir={dir} size={80} alpha={CONTRAST[level] / 100} />
      </div>
      <p className="tq">Which way is the gap?</p>
      <div className="pad">
        <span className="c" />
        <button aria-label="Up" onClick={() => onAns('up')}><Icon n="up" c="l" /></button>
        <span className="c" />
        <button aria-label="Left" onClick={() => onAns('left')}><span style={{ display:'grid', transform:'rotate(-90deg)' }}><Icon n="up" c="l" /></span></button>
        <span className="c" />
        <button aria-label="Right" onClick={() => onAns('right')}><span style={{ display:'grid', transform:'rotate(90deg)' }}><Icon n="up" c="l" /></span></button>
        <span className="c" />
        <button aria-label="Down" onClick={() => onAns('down')}><span style={{ display:'grid', transform:'rotate(180deg)' }}><Icon n="up" c="l" /></span></button>
        <span className="c" />
      </div>
      <div className="center" style={{ marginTop: 12 }}>
        <button className="btn sm" onClick={() => onAns('cant')}>Can&apos;t see</button>
      </div>
    </div>
  );
}
