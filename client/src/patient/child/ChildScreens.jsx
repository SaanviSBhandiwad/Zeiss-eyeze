// CHILD MODE: game-framed vision screening for ages 3–10.
// The clinical parts (optotype sizes, the 2-correct-per-level rule, the Amsler grid) match the adult tests exactly.
// Everything "game" (coins, stages, sounds, confetti) lives around the test card, never inside it, and is never
// tied to what the child reports on the Amsler grid, so it can't nudge the answers.
import { useEffect, useRef, useState } from 'react';
import { PAL } from '../../shared/index.js';
import { Icon, Mascot } from '../../lib/ui.jsx';
import { useStore } from '../../lib/store.js';
import * as A from '../state.js';
import { VA, VA_PX } from '../tests/constants.js';
import { LandoltRing, randDir } from '../tests/utils.jsx';
import { sfx } from './sfx.js';
import { useKidDistance, TARGET_CM } from './useKidDistance.js';

const { app, tt } = A;
const useP = () => useStore(app, s => s.p);
const useLang = () => useStore(app, s => s.lang);

/* ---------------- symbols ---------------- */
/* LEA-style symbols as simple black outline SVGs, drawn in a 10×10 box so they scale like the Landolt ring. */
const LEA = {
  house: <path d="M5 0.9 L9.2 4.7 V9.2 H0.8 V4.7 Z" fill="none" stroke="#000" strokeWidth="1.1" strokeLinejoin="round" />,
  circle: <circle cx="5" cy="5" r="4.1" fill="none" stroke="#000" strokeWidth="1.1" />,
  apple: <g fill="none" stroke="#000" strokeWidth="1.1" strokeLinejoin="round" strokeLinecap="round">
    <path d="M5 3.1 C3 1.7 0.8 2.7 0.9 5.4 C1 8.2 3 9.7 5 8.9 C7 9.7 9 8.2 9.1 5.4 C9.2 2.7 7 1.7 5 3.1 Z" /><path d="M5 3.1 L5.9 0.8" /></g>,
  hand: <g fill="none" stroke="#000" strokeWidth="1.1" strokeLinejoin="round" strokeLinecap="round">
    <path d="M2.2 5 V1.8 M3.9 4.6 V1 M5.6 4.6 V1.2 M7.3 5 V2.2" />
    <path d="M2.2 5 V7 C2.2 8.4 3.3 9.3 4.8 9.3 C6.6 9.3 7.6 8.2 7.9 6.8 L9.1 4.6" /><path d="M7.3 5 V6.2" /></g>,
  star: <path d="M5 0.8 L6.2 3.6 L9.2 3.8 L6.9 5.8 L7.6 8.8 L5 7.2 L2.4 8.8 L3.1 5.8 L0.8 3.8 L3.8 3.6 Z" fill="none" stroke="#000" strokeWidth="1" strokeLinejoin="round" />,
};
const LEA_NAME = { house: 'House', circle: 'Circle', apple: 'Apple', hand: 'Hand', star: 'Star' };
function LeaSym({ k, size }) {
  return <svg width={size} height={size} viewBox="0 0 10 10" role="img" aria-label={LEA_NAME[k]}>{LEA[k]}</svg>;
}
const pick = (list, exclude) => { const o = list.filter(x => x !== exclude); return o[Math.floor(Math.random() * o.length)]; };

/* ---------------- game juice ---------------- */
/* Wrong answer in practice: brief shake on the tapped button, no penalty. */
function useShake() {
  const [sh, setSh] = useState(null);
  const shake = k => { setSh(k); setTimeout(() => setSh(x => (x === k ? null : x)), 420); };
  return [sh, shake];
}

/* Floating "+10 🐟" pops and banners. */
function usePops() {
  const [pops, setPops] = useState([]);
  const id = useRef(0);
  const pop = (text, cls = '') => {
    const k = ++id.current;
    setPops(p => [...p, { k, text, cls }]);
    setTimeout(() => setPops(p => p.filter(x => x.k !== k)), 1100);
  };
  const el = <div className="kid-pops" aria-hidden="true">{pops.map(p => <span key={p.k} className={'kid-pop ' + p.cls}>{p.text}</span>)}</div>;
  return [el, pop];
}

const CONFETTI_COL = ['#f59e0b', '#ef4444', '#3b82f6', '#10b981', '#a855f7', '#ec4899'];
function Confetti({ n = 36 }) {
  const [bits] = useState(() => Array.from({ length: n }, (_, i) => ({
    left: Math.random() * 100, delay: Math.random() * 0.5, dur: 1.4 + Math.random() * 1.2,
    rot: Math.random() * 360, col: CONFETTI_COL[i % CONFETTI_COL.length], round: Math.random() < 0.3,
  })));
  return (
    <div className="kid-confetti" aria-hidden="true">
      {bits.map((b, i) => <i key={i} style={{ left: b.left + '%', background: b.col, animationDelay: b.delay + 's', animationDuration: b.dur + 's', transform: `rotate(${b.rot}deg)`, borderRadius: b.round ? '50%' : 2 }} />)}
    </div>
  );
}

/* Drishti hops whenever `beat` changes. */
function HopMascot({ beat, s = 52 }) {
  return <span key={beat} className={beat ? 'kid-hop' : ''} style={{ display: 'inline-block' }}><Mascot s={s} /></span>;
}

function Hud({ world, stage, beat, fx }) {
  const p = useP();
  const done = p.childTests || {};
  return (
    <div className="kid-hud">
      {fx /* pops and banners live up here, never over the test card */}
      <HopMascot beat={beat} s={44} />
      <div className="kid-hud-mid">
        {world && <b>{world}</b>}
        {stage ? <span>Stage {stage}</span> : null}
      </div>
      <div className="kid-hud-stars" aria-label="Missions">{CHILD_SEQ.map(k => <span key={k} className={done[k] ? '' : 'off'}>⭐</span>)}</div>
      <div className="kid-coins" aria-label={`${p.score || 0} coins`}>🪙 {p.score || 0}</div>
    </div>
  );
}

/* ---------------- distance: the "pilot cam" ---------------- */
const ZONE_MSG = {
  none: ['👀', 'Show Drishti your face!'],
  close: ['🐢', 'Whoa, too close! Move back a little'],
  far: ['🐰', 'Hop a little closer!'],
  ok: ['🚀', 'Locked in! Stay right there'],
};

function PilotCam({ d, hidden }) {
  const was = useRef(false);
  useEffect(() => { if (d.ok && !was.current && d.mode === 'camera') sfx.lock(); was.current = d.ok; }, [d.ok, d.mode]);
  const cm = d.mm ? Math.round(d.mm / 10) : null;
  // meter: 20 cm (left) … 60 cm (right); target band in the middle
  const pos = cm == null ? null : Math.max(0, Math.min(100, ((cm - 20) / 40) * 100));
  const [emo, msg] = d.mode === 'manual' ? ['📏', `Hold the phone one forearm away (about ${TARGET_CM} cm)`]
    : d.loading ? ['📷', 'Starting Drishti’s pilot cam…'] : ZONE_MSG[d.zone];
  return (
    // Always mounted (only hidden), so the camera stream stays attached to this <video> between eyes.
    <div className={'kid-pilot ' + (d.mode === 'camera' && !d.loading ? (d.ok ? 'ok' : 'off') : '')} style={hidden ? { display: 'none' } : undefined}>
      <div className="kid-lens">
        <video ref={d.cam.videoRef} playsInline muted autoPlay aria-label="Camera preview" style={{ display: d.mode === 'camera' ? 'block' : 'none' }} />
        {d.mode !== 'camera' && <span>📏</span>}
      </div>
      <div className="kid-pilot-body">
        <div className="kid-pilot-msg"><span aria-hidden="true">{emo}</span> {msg}</div>
        {d.mode === 'camera' && !d.loading && (
          <div className="kid-meter" aria-label={cm ? cm + ' cm' : 'no reading'}>
            <i className="band" />
            {pos != null && <b style={{ left: pos + '%' }} />}
            <small>{cm ? cm + ' cm' : '—'}</small>
          </div>
        )}
        {d.mode === 'camera' && <button className="lnk xs" onClick={d.playWithoutCamera}>Play without camera</button>}
      </div>
    </div>
  );
}

/* Covers the test card while the child is out of range, so no answer is ever taken at the wrong distance. */
function Paused({ d }) {
  const [emo, msg] = d.loading ? ['📷', 'Getting the camera ready…'] : ZONE_MSG[d.zone];
  return (
    <div className="kid-paused" role="status">
      <span className="kid-paused-emo">{emo}</span>
      <b>{msg}</b>
      <small>The game waits until you’re in the sweet spot</small>
    </div>
  );
}

/* ---------------- answer pads ---------------- */
function KidDirPad({ onAns, shaking, cant, disabled }) {
  const b = (d, rot, lab) => (
    <button aria-label={lab} disabled={disabled} className={shaking === d ? 'shake' : ''} onClick={() => onAns(d)}>
      <span style={{ display: 'grid', transform: `rotate(${rot}deg)` }}><Icon n="up" c="l" /></span>
    </button>
  );
  return (
    <>
      <div className="pad kid-pad">
        <span className="c" />{b('up', 0, 'Up')}<span className="c" />
        {b('left', -90, 'Left')}<span className="c" />{b('right', 90, 'Right')}
        <span className="c" />{b('down', 180, 'Down')}<span className="c" />
      </div>
      {cant && <div className="center" style={{ marginTop: 10 }}><button className="btn sm" disabled={disabled} onClick={() => onAns('cant')}>I can&apos;t see it</button></div>}
    </>
  );
}

function KidSymPad({ opts, onAns, shaking, cant, disabled }) {
  return (
    <>
      <div className="kid-syms">
        {opts.map(k => <button key={k} aria-label={LEA_NAME[k]} disabled={disabled} className={shaking === k ? 'shake' : ''} onClick={() => onAns(k)}><LeaSym k={k} size={52} /></button>)}
      </div>
      {cant && <div className="center" style={{ marginTop: 10 }}><button className="btn sm" disabled={disabled} onClick={() => onAns('cant')}>I can&apos;t see it</button></div>}
    </>
  );
}

/* ---------------- entry overlay (opened from the home card) ---------------- */
export function ChildModeEntry({ onClose }) {
  useLang();
  const [name, setName] = useState('');
  const [band, setBand] = useState(null);
  return (
    <div className="mbg" onClick={e => e.target === e.currentTarget && onClose?.()}>
      <div className="sheet center kid-sheet" role="dialog" aria-labelledby="kidt">
        <div className="row" style={{ justifyContent: 'space-between' }}>
          <button className="btn sm" aria-label={tt('back')} onClick={onClose}><Icon n="back" c="s" /> {tt('back')}</button>
          <span />
        </div>
        <span className="kid-float"><Mascot s={80} /></span>
        <h2 className="h2" id="kidt" style={{ marginTop: 10 }}>{tt('childMode')}</h2>
        <p className="muted small">A 5-minute eye game. You’ll need the phone’s front camera.</p>
        <label className="fld" style={{ textAlign: 'left', marginTop: 12 }}>
          <span>{tt('childNameQ')}</span>
          <input className="kid-name" value={name} maxLength={40} placeholder="What's their name?" onChange={e => setName(e.target.value)} />
        </label>
        <p style={{ marginTop: 16, fontWeight: 700 }}>{tt('childAgeQ')}</p>
        <div className="kid-age">
          <button aria-pressed={band === '3-5'} onClick={() => { sfx.boop(); setBand('3-5'); }}><span>⭐</span>{tt('childAge35')}</button>
          <button aria-pressed={band === '6-10'} onClick={() => { sfx.boop(); setBand('6-10'); }}><span>🐟</span>{tt('childAge610')}</button>
        </div>
        <button className="btn p big w" style={{ marginTop: 18 }} disabled={!band} onClick={() => { onClose?.(); A.startChildMode(band, name); }}>
          Let&apos;s go! <Icon n="fwd" />
        </button>
      </div>
    </div>
  );
}

/* ---------------- parent questions ---------------- */
const PARENT_Q = [
  { id: 'sq_tv', t: 'Does your child sit very close to the TV or screen?', o: [['yes', 'Yes'], ['no', 'No'], ['sometimes', 'Sometimes']] },
  { id: 'sq_squint', t: 'Do they squint or tilt their head to see?', o: [['yes', 'Yes'], ['no', 'No'], ['sometimes', 'Sometimes']] },
  { id: 'sq_turn', t: 'Has anyone noticed an eye turning in or out?', o: [['yes', 'Yes'], ['no', 'No'], ['unsure', 'Not sure']] },
  { id: 'sq_family', t: 'Does anyone in the family wear glasses?', o: [['yes', 'Yes'], ['no', 'No'], ['unsure', 'Not sure']] },
];

export function ChildParentQ() {
  const p = useP(); useLang();
  const [i, setI] = useState(0);
  const q = PARENT_Q[i], val = p.parentAnswers[q.id], last = i === PARENT_Q.length - 1;
  return (
    <div className="wrap n">
      <div className="kid-dots" aria-label={`Question ${i + 1} of ${PARENT_Q.length}`}>{PARENT_Q.map((x, k) => <i key={x.id} className={k <= i ? 'on' : ''} />)}</div>
      <div className="talk">
        <Mascot s={64} />
        <div className="bubble">
          <div className="lead">Before we start — a few quick questions for you about {p.childName}.</div>
          <h2>{q.t}</h2>
        </div>
      </div>
      <div className="tiles">
        {q.o.map(([v, l], k) => (
          <button key={v} className="tile" aria-pressed={val === v} onClick={() => A.setParentAnswer(q.id, v)}>
            <span className="tick"><Icon n="check" /></span><span className={'blob c-' + PAL[k % PAL.length]}><Icon n={v === 'yes' ? 'check' : v === 'no' ? 'x' : 'list'} /></span>{l}
          </button>
        ))}
      </div>
      <div className="qfoot">
        {i > 0 ? <button className="btn" aria-label={tt('back')} onClick={() => setI(i - 1)}><Icon n="back" /></button> : <span style={{ width: 52 }} />}
        <span />
        {last
          ? <button className="btn p" disabled={!val} onClick={A.doneParentQ}>Hand the phone to {p.childName} <Icon n="fwd" c="s" /></button>
          : <button className="btn p" disabled={!val} onClick={() => setI(i + 1)}>{tt('next')} <Icon n="fwd" c="s" /></button>}
      </div>
    </div>
  );
}

/* ---------------- practice = tutorial level (doesn't count) ---------------- */
const PRACTICE_SYMS = ['house', 'circle', 'apple'];
export function ChildPractice() {
  const p = useP(); useLang();
  const young = p.childAge === '3-5';
  const d = useKidDistance();
  const [target, setTarget] = useState(() => (young ? pick(PRACTICE_SYMS) : randDir()));
  const [hits, setHits] = useState(0);
  const [won, setWon] = useState(false);
  const [sh, shake] = useShake();
  const [pops, pop] = usePops();
  const onAns = a => {
    if (a !== target) { sfx.soft(); return shake(a); }
    sfx.coin(); pop('Yes! ✨');
    if (hits + 1 >= 2) {
      setHits(2); setWon(true); sfx.levelUp();
      setTimeout(A.passPractice, 1600);
      return;
    }
    setHits(hits + 1);
    setTarget(young ? pick(PRACTICE_SYMS, target) : randDir(target));
  };
  return (
    <div className="wrap n kid-world ocean">
      <div className="talk">
        <HopMascot beat={hits} s={70} />
        <div className="bubble">
          <div className="lead">🎮 Tutorial</div>
          <h2>{tt('childPracticeTitle')}</h2>
          <div className="lead">{tt('childPracticeSub')}</div>
        </div>
      </div>
      <PilotCam d={d} />
      <div className="kid-stars" aria-label={`${hits} of 2`}>{[0, 1].map(k => <span key={k} className={k < hits ? 'kid-pop-in' : 'off'}>⭐</span>)}</div>
      <div className="kid-play">
        {pops}
        {won && <Confetti />}
        {won
          ? <div className="tcard kid-banner-card"><div className="kid-banner">TUTORIAL COMPLETE!</div></div>
          : !d.ok ? <div className="tcard"><Paused d={d} /></div>
          : young ? <div className="tcard" style={{ minHeight: 200 }}><LeaSym k={target} size={120} /></div>
          : <div className="tcard" style={{ minHeight: 200 }}><div className="center"><div className="kid-say">{tt('whichWay')}</div><br /><LandoltRing dir={target} size={80} /></div></div>}
      </div>
      {young
        ? <><p className="center" style={{ fontWeight: 700, marginTop: 10 }}>Tap the same picture!</p><KidSymPad opts={['house', 'circle', 'apple', 'star']} onAns={onAns} shaking={sh} disabled={!d.ok || won} /></>
        : <KidDirPad onAns={onAns} shaking={sh} disabled={!d.ok || won} />}
    </div>
  );
}

/* ---------------- real tests ---------------- */
const CHILD_SEQ = ['va', 'amsler'];
const LEA_TEST = ['house', 'circle', 'apple', 'hand'];
const START_LEVEL = 2; // 6/24

function EyePill({ eye }) {
  return <div className="kid-eye" role="status">{tt(eye === 'R' ? 'coverLeft' : 'coverRight')}</div>;
}

function BetweenEyes({ text = 'Great job!' }) {
  return (
    <div className="card center kid-between" style={{ padding: 40 }}>
      <Confetti n={24} />
      <span className="kid-star">⭐</span>
      <h2 className="h2" style={{ marginTop: 10 }}>{text}</h2>
      <p className="muted small">Now switch hands to cover the other eye 🤚</p>
    </div>
  );
}

/* Ocean world: "catch the fish". Correct answers earn coins; a miss just moves on (no "wrong" message). */
function ChildVA({ state, young, d, onDone }) {
  const nextTarget = ex => (young ? pick(LEA_TEST, ex) : randDir(ex));
  const [eye, setEye] = useState(state.eye ?? 'R');
  const [level, setLevel] = useState(state.level ?? START_LEVEL);
  const [target, setTarget] = useState(() => (young ? pick(LEA_TEST) : state.dir ?? randDir()));
  const [correct, setCorrect] = useState(0);
  const [best, setBest] = useState(state.best ?? -1);
  const [fellBack, setFellBack] = useState(false);
  const [rTmp, setRTmp] = useState(null);
  const [between, setBetween] = useState(false);
  const [stage, setStage] = useState(1);
  const [streak, setStreak] = useState(0);
  const [beat, setBeat] = useState(0);
  const [levelUp, setLevelUp] = useState(0);
  const [pops, pop] = usePops();

  const reset = () => { setLevel(START_LEVEL); setCorrect(0); setBest(-1); setFellBack(false); setTarget(nextTarget()); setStage(1); setStreak(0); };

  function finishEye(b) {
    if (eye === 'R') {
      setRTmp(b); setBetween(true); sfx.levelUp();
      setTimeout(() => { setEye('L'); reset(); setBetween(false); }, 1800);
    } else onDone({ R: rTmp, L: b, ...dist(d) });
  }

  function onAns(a) {
    d.mark();
    if (a === target) {
      const s = streak + 1;
      setStreak(s); setBeat(x => x + 1);
      A.addScore(10 * Math.min(s, 3));
      sfx.coin();
      pop(young ? `+${10 * Math.min(s, 3)} 🪙` : `+${10 * Math.min(s, 3)} 🐟`);
      if (s >= 3) setTimeout(() => pop(`Combo x${Math.min(s, 3)}!`, 'combo'), 200);
      const n = correct + 1;
      if (n >= 2) {
        if (level >= VA.length - 1) { A.addScore(50); return finishEye(level); }
        setBest(level); setLevel(level + 1); setCorrect(0); setTarget(nextTarget());
        setStage(st => st + 1); setLevelUp(x => x + 1); setTimeout(sfx.levelUp, 150);
      } else { setCorrect(n); setTarget(nextTarget(target)); }
      return;
    }
    setStreak(0); sfx.soft();
    // Missed the first (6/24) level before passing anything: drop to 6/60 and climb with the adult rule,
    // so a child who can't see 6/24 is measured rather than recorded as "worse than 6/60".
    if (best < 0 && level === START_LEVEL && !fellBack) { setFellBack(true); setLevel(0); setCorrect(0); setTarget(nextTarget()); return; }
    finishEye(best);
  }

  return (
    <div className="kid-world ocean">
      <Hud world={eye === 'R' ? '🌊 Ocean world 1' : '🌊 Ocean world 2'} stage={stage} beat={beat}
        fx={<>{pops}{levelUp > 0 && <div key={levelUp} className="kid-levelup" aria-hidden="true">STAGE {stage}! ⬆️</div>}</>} />
      <PilotCam d={d} hidden={between} />
      {between ? <BetweenEyes text="World complete!" /> : <>
        <p className="muted small center" style={{ margin: '0 0 6px' }}>Help Drishti find the hiding fish 🐟</p>
        <EyePill eye={eye} />
        <div className="kid-play">
          <div className="tcard">
            {!d.ok ? <Paused d={d} /> : <>
              <span className="lv">{VA[level]}</span>
              {young ? <LeaSym k={target} size={VA_PX[level]} /> : <LandoltRing dir={target} size={VA_PX[level]} />}
            </>}
          </div>
        </div>
        {young
          ? <><p className="center" style={{ fontWeight: 700, marginTop: 10 }}>Which picture is it?</p><KidSymPad opts={LEA_TEST} onAns={onAns} cant disabled={!d.ok} /></>
          : <><p className="center" style={{ fontWeight: 700, marginTop: 10 }}>{tt('whichWay')}</p><KidDirPad onAns={onAns} cant disabled={!d.ok} /></>}
      </>}
    </div>
  );
}

/* Space world: scan the radar. Same coins whatever is marked, so marking squares is never rewarded. */
function ChildAmsler({ state, d, onDone }) {
  const [eye, setEye] = useState(state.eye ?? 'R');
  const [marks, setMarks] = useState([]);
  const [rCount, setRCount] = useState(state.R ?? 0);
  const [between, setBetween] = useState(false);
  const toggle = i => { sfx.boop(); setMarks(m => (m.includes(i) ? m.filter(x => x !== i) : [...m, i])); };
  function finishEye(n) {
    d.mark(); A.addScore(30); sfx.coin();
    if (eye === 'R') {
      setRCount(n); setBetween(true); sfx.levelUp();
      setTimeout(() => { setEye('L'); setMarks([]); setBetween(false); }, 1800);
    } else onDone({ R: rCount, L: n, ...dist(d) });
  }
  return (
    <div className="kid-world space">
      <Hud world={eye === 'R' ? '🚀 Space radar 1' : '🚀 Space radar 2'} />
      <PilotCam d={d} hidden={between} />
      {between ? <BetweenEyes text="Radar scanned!" /> : <>
        <p className="muted small center" style={{ margin: '0 0 6px' }}>Look at the dot in the middle. Can you see it clearly? 👀</p>
        <EyePill eye={eye} />
        <p className="center" style={{ fontWeight: 700 }}>Keep looking at the dot. Tap any squares that look wobbly, missing, or funny.</p>
        <div className="tcard">
          {!d.ok ? <Paused d={d} /> : (
            <div className="amsler" role="group" aria-label="Amsler grid">
              {Array.from({ length: 196 }, (_, i) => <button key={i} data-v={i} aria-pressed={marks.includes(i)} aria-label={`Square ${i + 1}`} onClick={() => toggle(i)} />)}
            </div>
          )}
        </div>
        <div className="row" style={{ marginTop: 14 }}>
          <button className="btn" style={{ flex: 1 }} disabled={!d.ok || marks.length === 0} onClick={() => finishEye(marks.length)}>Done</button>
          <button className="btn p" style={{ flex: 1 }} disabled={!d.ok || marks.length > 0} onClick={() => finishEye(0)}>All looks fine</button>
        </div>
      </>}
    </div>
  );
}

/* Extra fields on the test result: how far away the child was. cleanTests() keeps them; the adult fields are unchanged. */
const dist = d => { const s = d.summary(); return { distCm: s.cm, distChecked: s.checked }; };

export function ChildTestRunner() {
  const p = useP(); useLang();
  const d = useKidDistance(); // one camera for the whole test, kept running across both eyes
  const cur = p.cur;
  if (!cur) return null;
  const young = p.childAge === '3-5';
  return (
    <div className="wrap n">
      {cur === 'va' && <ChildVA key={'va' + p.childAge} state={p.ts || {}} young={young} d={d} onDone={r => A.doneChildTest('va', r)} />}
      {cur === 'amsler' && <ChildAmsler key="amsler" state={p.ts || {}} d={d} onDone={r => A.doneChildTest('amsler', r)} />}
    </div>
  );
}

/* ---------------- between-tests reward ---------------- */
export function ChildReward() {
  const p = useP(); useLang();
  const allDone = CHILD_SEQ.every(k => p.childTests?.[k]);
  useEffect(() => { A.resumeChild(); if (allDone) sfx.win(); else sfx.levelUp(); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <div className="wrap n"><div className="card center kid-reward" style={{ padding: '56px 24px' }}>
      <Confetti n={allDone ? 60 : 40} />
      <div className="kid-banner">{allDone ? 'YOU BEAT THE GAME! 🏆' : 'MISSION COMPLETE!'}</div>
      <span className="kid-star" aria-hidden="true">⭐</span>
      <h2 className="h2" style={{ marginTop: 16 }}>{tt('childStar', { name: p.childName || 'friend' })}</h2>
      <div className="kid-coins big">🪙 {p.score || 0}</div>
      <p className="muted small" style={{ marginTop: 8 }}>{allDone ? tt('childDone') : 'Getting ready for the next mission…'}</p>
    </div></div>
  );
}
