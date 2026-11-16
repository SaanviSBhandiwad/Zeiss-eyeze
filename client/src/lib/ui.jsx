// Small shared UI pieces: icons, the Drishti mascot, toasts, time formatting.
import { useEffect, useState } from 'react';
import { ICO } from './icons.js';
import { useStore } from './store.js';
import { voiceState } from './voice.js';

export function Icon({ n, c = '' }) {
  return <svg className={'i ' + c} viewBox="0 0 24 24" aria-hidden="true" dangerouslySetInnerHTML={{ __html: ICO[n] || '' }} />;
}

export function Mascot({ s = 56, cls = '' }) {
  const speaking = useStore(voiceState, v => v.speaking);
  return (
    <div className={`mascot ${cls} ${speaking ? 'speaking' : ''}`} style={{ '--s': s + 'px' }}>
      <svg viewBox="0 0 64 64" aria-hidden="true">
        <circle cx="32" cy="32" r="31" fill="#2563eb" />
        <path d="M8 32c6-10 14-15 24-15s18 5 24 15c-6 10-14 15-24 15S14 42 8 32z" fill="#fff" />
        <g className="pup">
          <circle cx="32" cy="32" r="10" fill="#1d4ed8" />
          <circle cx="32" cy="32" r="10" fill="none" stroke="#93c5fd" strokeWidth="2.4" strokeDasharray="2.6 2.6" />
          <circle cx="32" cy="32" r="4.4" fill="#0d47a1" />
          <circle cx="35.5" cy="28.5" r="2.2" fill="#fff" />
        </g>
        <path d="M22 52q10 6 20 0" stroke="#fff" strokeWidth="3" fill="none" strokeLinecap="round" />
      </svg>
    </div>
  );
}

/* toasts */
let pushToast = () => {};
export const toast = msg => pushToast(msg);
export function Toasts() {
  const [items, setItems] = useState([]);
  useEffect(() => {
    pushToast = msg => {
      const id = Math.random();
      setItems(x => [...x, { id, msg }]);
      setTimeout(() => setItems(x => x.filter(i => i.id !== id)), 3800);
    };
    return () => { pushToast = () => {}; };
  }, []);
  return <div id="toasts" aria-live="polite">{items.map(i => <div key={i.id} className="toast">{i.msg}</div>)}</div>;
}

export function ago(ts) {
  const m = Math.max(0, Math.round((Date.now() - ts) / 60000));
  if (m < 1) return 'just now';
  if (m < 60) return m + ' min ago';
  const h = Math.round(m / 60);
  if (h < 24) return h + ' h ago';
  return Math.round(h / 24) + ' d ago';
}
const LOC = { en: 'en-IN', hi: 'hi-IN', kn: 'kn-IN' };
export const fmtDate = (ts, lang = 'en') => new Date(ts || Date.now()).toLocaleDateString(LOC[lang], { day: 'numeric', month: 'long', year: 'numeric' });
export const fmtTime = ts => new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

/** Re-render every `ms` so "5 min ago" labels stay fresh. */
export function useTick(ms = 30000) {
  const [, set] = useState(0);
  useEffect(() => { const i = setInterval(() => set(x => x + 1), ms); return () => clearInterval(i); }, [ms]);
}
