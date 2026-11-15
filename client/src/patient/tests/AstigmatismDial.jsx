function DialSVG({ onLine }) {
  const lines = [];
  for (let k = 1; k <= 6; k++) {
    const a = (k * 30 - 90) * Math.PI / 180;
    const x = Math.cos(a) * 105, y = Math.sin(a) * 105;
    const px = -Math.sin(a) * 4, py = Math.cos(a) * 4;
    const lx = Math.cos(a) * 120, ly = Math.sin(a) * 120;
    lines.push(
      <g key={k} onClick={() => onLine(k)} role="button" aria-label={`Line ${k} to ${k + 6}`} style={{ cursor: 'pointer' }}>
        <line x1={-x} y1={-y} x2={x} y2={y} stroke="transparent" strokeWidth={24} />
        {[-1, 0, 1].map(o => (
          <line key={o} className="v" x1={(-x + px * o).toFixed(1)} y1={(-y + py * o).toFixed(1)} x2={(x + px * o).toFixed(1)} y2={(y + py * o).toFixed(1)} stroke="#000" strokeWidth={1.6} />
        ))}
        <text x={lx.toFixed(1)} y={(ly + 5).toFixed(1)} textAnchor="middle" fontSize={12} fill="#444">{k}</text>
        <text x={(-lx).toFixed(1)} y={(-ly + 5).toFixed(1)} textAnchor="middle" fontSize={12} fill="#444">{k + 6}</text>
      </g>
    );
  }
  return (
    <svg className="dial" viewBox="-130 -130 260 260" width={250} height={250} role="group" aria-label="Astigmatism dial">
      {lines}
      <circle r={6} fill="#fff" stroke="#000" strokeWidth={1.5} />
    </svg>
  );
}

export default function AstigmatismDial({ onDone }) {
  return (
    <div>
      <div className="instr" style={{ marginBottom: 8 }}>
        <span>Cover your left eye. Which line looks darkest?</span>
      </div>
      <div className="tcard">
        <DialSVG onLine={k => onDone({ res: 'possible', clock: k, axis: k * 30 })} />
      </div>
      <p className="tq">Tap the darkest line, or:</p>
      <div className="center">
        <button className="btn p" onClick={() => onDone({ res: 'none' })}>All the same</button>
      </div>
    </div>
  );
}
