import { useState } from 'react';
import { Icon } from '../../lib/ui.jsx';
import { VA, VA_PX } from './constants.js';
import { LandoltRing, randDir, vaStr } from './utils.jsx';

function DirPad({ onAns }) {
  return (
    <>
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
    </>
  );
}

export default function AcuityRings({ state, onDone }) {
  const [eye, setEye] = useState(state.eye ?? 'R');
  const [level, setLevel] = useState(state.level ?? 0);
  const [dir, setDir] = useState(state.dir ?? randDir());
  const [correct, setCorrect] = useState(0);
  const [best, setBest] = useState(state.best ?? -1);
  const [vaTmpR, setVaTmpR] = useState(null);

  function finishEye(bestLevel) {
    if (eye === 'R') {
      setVaTmpR(bestLevel);
      setEye('L');
      setLevel(0);
      setDir(randDir());
      setCorrect(0);
      setBest(-1);
    } else {
      onDone({ R: vaTmpR, L: bestLevel });
    }
  }

  function onAns(d) {
    if (d === 'cant') { finishEye(best); return; }
    if (d === dir) {
      const newCorrect = correct + 1;
      if (newCorrect >= 2) {
        const newBest = level;
        if (level >= VA.length - 1) { finishEye(newBest); return; }
        setBest(newBest);
        setLevel(l => l + 1);
        setCorrect(0);
        setDir(randDir());
      } else {
        setCorrect(newCorrect);
        setDir(randDir(dir));
      }
    } else {
      finishEye(best);
    }
  }

  return (
    <div>
      <div className="tcard">
        <span className="lv">{VA[level]}</span>
        <LandoltRing dir={dir} size={VA_PX[level]} />
      </div>
      <div className="instr" style={{ marginBottom: 8 }}>
        <Icon n="hand" /><span>{eye === 'R' ? 'Cover your LEFT eye' : 'Cover your RIGHT eye'}</span>
      </div>
      <DirPad onAns={onAns} />
    </div>
  );
}
