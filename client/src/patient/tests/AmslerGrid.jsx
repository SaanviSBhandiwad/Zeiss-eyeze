import { useState } from 'react';
import { Icon } from '../../lib/ui.jsx';

export default function AmslerGrid({ state, onDone }) {
  const [eye, setEye] = useState(state.eye ?? 'R');
  const [marks, setMarks] = useState([]);
  const [rCount, setRCount] = useState(state.R ?? 0);

  function toggleMark(idx) {
    setMarks(m => m.includes(idx) ? m.filter(x => x !== idx) : [...m, idx]);
  }

  function finishEye(markCount) {
    if (eye === 'R') {
      setRCount(markCount);
      setEye('L');
      setMarks([]);
    } else {
      onDone({ R: rCount, L: markCount });
    }
  }

  return (
    <div>
      <div className="instr" style={{ marginBottom: 8 }}>
        <Icon n="hand" /><span>{eye === 'R' ? 'Cover your LEFT eye' : 'Cover your RIGHT eye'}</span>
      </div>
      <p className="muted" style={{ marginTop: 10 }}>Tap any squares that look distorted or missing</p>
      <div className="tcard">
        <div className="amsler" role="group" aria-label="Amsler grid">
          {Array.from({ length: 196 }, (_, idx) => (
            <button
              key={idx}
              data-v={idx}
              aria-pressed={marks.includes(idx)}
              aria-label={`Square ${idx + 1}`}
              onClick={() => toggleMark(idx)}
            />
          ))}
        </div>
      </div>
      <div className="row" style={{ marginTop: 14 }}>
        <button className="btn" style={{ flex: 1 }} disabled={marks.length === 0} onClick={() => finishEye(marks.length)}>
          Done marking
        </button>
        <button className="btn p" style={{ flex: 1 }} onClick={() => finishEye(0)}>
          All straight
        </button>
      </div>
    </div>
  );
}
