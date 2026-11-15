// Near reading test (near): the person reads lines of shrinking print at about 40 cm. Ported from the prototype's nearAns().
// Result: { level } where level is the index in NEAR of the smallest print read (-1 = could not read even N24), or {} when skipped.
// Print size is scaled by the screen's px/mm from the setup test, because NEAR_PX was designed for 3.78 px/mm (96 dpi).
import { useState } from 'react';
import { Icon } from '../../lib/ui.jsx';
import { useStore } from '../../lib/store.js';
import { app } from '../state.js';
import { NEAR, NEAR_PX, READ_LINES } from './constants.js';
import { useTr } from '../../camera/useTr.js';

const REF_PX_PER_MM = 3.78;

export default function NearReading({ onDone }) {
  const tr = useTr();
  const [level, setLevel] = useState(0);
  const pxmm = useStore(app, s => s.p.tests?.setup?.pxmm);
  const k = Number.isFinite(pxmm) && pxmm > 0 ? pxmm / REF_PX_PER_MM : 1;

  const yes = () => (level >= NEAR.length - 1 ? onDone({ level }) : setLevel(level + 1));
  const no = () => onDone({ level: level - 1 });

  return (
    <div>
      <div className="instr"><Icon n="book" /><span>{tr('distTitle')}</span></div>
      <div className="tcard" style={{ marginTop: 12 }}>
        <span className="lv">{NEAR[level]}</span>
        <p className="readtxt" style={{ fontSize: NEAR_PX[level] * k }}>{READ_LINES[level % 3]}</p>
      </div>
      <p className="tq">{tr('canRead')}</p>
      <div className="row" style={{ marginTop: 10 }}>
        <button className="btn" style={{ flex: 1 }} onClick={no}><Icon n="x" c="s" /> {tr('no')}</button>
        <button className="btn p" style={{ flex: 1 }} onClick={yes}><Icon n="check" c="s" /> {tr('yes')}</button>
      </div>
      <div className="center" style={{ marginTop: 10 }}>
        <button className="lnk" onClick={() => onDone({})}>{tr('nearAskSkip')}</button>
      </div>
    </div>
  );
}
