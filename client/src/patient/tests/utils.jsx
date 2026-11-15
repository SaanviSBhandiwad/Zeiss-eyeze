import { VA } from './constants.js';

export function randDir(exclude) {
  const dirs = ['up','right','down','left'];
  const opts = exclude ? dirs.filter(d => d !== exclude) : dirs;
  return opts[Math.floor(Math.random() * opts.length)];
}

export function vaStr(i) {
  return i < 0 ? 'worse than 6/60' : VA[i];
}

export function LandoltRing({ dir, size, alpha = 1 }) {
  const deg = {up:0,right:90,down:180,left:270}[dir];
  return (
    <svg width={size} height={size} viewBox="-2.6 -2.6 5.2 5.2" role="img" aria-label="Landolt ring">
      <g transform={`rotate(${deg})`}>
        <circle r="2" fill="none" stroke={`rgba(0,0,0,${alpha})`} strokeWidth="1"/>
        <rect x="1.3" y="-0.5" width="1.5" height="1" fill="#ffffff"/>
      </g>
    </svg>
  );
}

export function mulberry(a) {
  return function() {
    a |= 0;
    a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
