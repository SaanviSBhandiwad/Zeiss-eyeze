// CHILD MODE: a video-game version of the vision screening for ages 3–10.
//
// What changes from the adult flow: the activities around the test. Hero picker, world map, "Chomp Canyon"
// (ages 6–10: swipe food into the chomper's open mouth), "Egg Island" (ages 3–5: tap the matching egg to hatch a
// creature), "Glitch Grid" (stare challenge + flag wobbly blocks), and a treasure chest at the end.
//
// What does NOT change (so results stay comparable with the adult tests and the portal):
//  - the test card: plain black optotype on white, VA_PX sizes, Landolt ring / LEA symbol, 4 choices
//  - the staircase: 2 correct per level to advance, a miss ends the eye, right eye then left eye
//  - the Amsler grid: same 14×14 grid with the centre dot, result {R, L} = number of marked squares
//  - the camera distance gate: answers are only accepted at ~40 cm
// Game feedback never shares the screen with an optotype, and Amsler marks are never rewarded.
import { useEffect, useRef, useState } from 'react';
import { PAL } from '../../shared/index.js';
import { Icon, Mascot } from '../../lib/ui.jsx';
import { useStore } from '../../lib/store.js';
import * as A from '../state.js';
import { VA, VA_PX } from '../tests/constants.js';
import { LandoltRing, randDir } from '../tests/utils.jsx';
import { sfx } from './sfx.js';
import { voiceState } from '../../lib/voice.js';
import { useKidDistance, TARGET_CM } from './useKidDistance.js';

const { app, tt } = A;
const useP = () => useStore(app, s => s.p);
const useLang = () => useStore(app, s => s.lang);
/* ---------------- Drishti's voice ----------------
   Says `text` once per `key`, in the current language, as soon as `ready` is true (e.g. only once the child is
   at the right distance). Uses the app's normal voice (Sarvam when configured, else the browser) and the
   header speaker button mutes it. Taps are never narrated; the sound effects cover those. */
function useSay(key, text, ready = true) {
  const lang = useLang(), on = useStore(app, s => s.voiceOn);
  const said = useRef(null);
  useEffect(() => {
    if (!key || !text || !ready || !on) return;
    const k = key + '|' + lang;
    if (said.current === k) return;
    said.current = k;
    A.say(text);
  }, [key, ready, lang, on]); // eslint-disable-line react-hooks/exhaustive-deps
}
/** Without the camera, every instruction starts with the distance reminder. */
const distHint = d => (d.mode === 'manual' ? tt('kZoneManual', { cm: TARGET_CM }) + ' ' : '');

/** The child's name, or a friendly word in the current language when none was given. */
export const hasName = p => !!p.childName && p.childName !== 'friend';
export const kidName = p => (hasName(p) ? p.childName : tt('kFriend'));
/** Use `key` with the name, or `anonKey` (worded for no name) when the parent skipped it. */
export const named = (p, key, anonKey, vars = {}) => (hasName(p) ? tt(key, { ...vars, name: p.childName }) : tt(anonKey, vars));

/* ---------------- game content ---------------- */
const HEROES = [['🦖', 'Rex'], ['🤖', 'Bolt'], ['🦄', 'Sparkle'], ['🐱', 'Whiskers'], ['🐼', 'Bamboo'], ['🐸', 'Hopper']];
const CREATURES = ['🐣', '🦊', '🐸', '🐙', '🐲', '🐢', '🦋', '🐬', '🦉', '🐝', '🐞', '🦔', '🐧', '🐨', '🦁', '🐯'];
const FOODS = ['🍎', '🍩', '🍕', '🍓', '🧁', '🍌', '🍪', '🍉'];
const EGG_COL = ['#ff6b9d', '#4dabf7', '#51cf66', '#ffd43b'];
const DIR_COL = { up: '#ff6b6b', right: '#4dabf7', down: '#51cf66', left: '#fcc419' };
const DIR_ROT = { up: 0, right: 90, down: 180, left: -90 };
const DIR_VEC = { up: [0, -1], right: [1, 0], down: [0, 1], left: [-1, 0] };
const CHILD_SEQ = ['va', 'amsler'];
const rnd = list => list[Math.floor(Math.random() * list.length)];
const pick = (list, exclude) => rnd(list.filter(x => x !== exclude));

/* ---------------- symbols (unchanged optotypes) ---------------- */
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
const LEA_TEST = ['house', 'circle', 'apple', 'hand'];
function LeaSym({ k, size }) {
  return <svg width={size} height={size} viewBox="0 0 10 10" role="img" aria-label={LEA_NAME[k]}>{LEA[k]}</svg>;
}

/* ---------------- juice ---------------- */
function usePops() {
  const [pops, setPops] = useState([]);
  const id = useRef(0);
  const pop = (text, cls = '') => {
    const k = ++id.current;
    setPops(p => [...p, { k, text, cls }]);
    setTimeout(() => setPops(p => p.filter(x => x.k !== k)), 1100);
  };
  return [<div key="pops" className="kid-pops" aria-hidden="true">{pops.map(p => <span key={p.k} className={'kid-pop ' + p.cls}>{p.text}</span>)}</div>, pop];
}

const CONFETTI_COL = ['#ff6b6b', '#ffd43b', '#4dabf7', '#51cf66', '#cc5de8', '#ff922b'];
function Confetti({ n = 40 }) {
  const [bits] = useState(() => Array.from({ length: n }, (_, i) => ({
    left: Math.random() * 100, delay: Math.random() * 0.6, dur: 1.4 + Math.random() * 1.3,
    rot: Math.random() * 360, col: CONFETTI_COL[i % CONFETTI_COL.length], sq: Math.random() < 0.6,
  })));
  return (
    <div className="kid-confetti" aria-hidden="true">
      {bits.map((b, i) => <i key={i} style={{ left: b.left + '%', background: b.col, animationDelay: b.delay + 's', animationDuration: b.dur + 's', transform: `rotate(${b.rot}deg)`, width: b.sq ? 10 : 7, height: b.sq ? 10 : 15 }} />)}
    </div>
  );
}

/* Feedback lasts this long; the next optotype only appears after it (never under an animation). */
const FB_MS = 650;

/* ---------------- shell + HUD ---------------- */
function Shell({ theme, children }) {
  return (
    <div className={'kg kg-' + theme}>
      <div className="kg-clouds" aria-hidden="true"><i /><i /><i /></div>
      <div className="kg-in">{children}</div>
      <div className="kg-ground" aria-hidden="true" />
    </div>
  );
}

function Hud({ title, beat = 0, fx }) {
  const p = useP();
  const score = p.score || 0, lv = Math.floor(score / 100) + 1, xp = score % 100;
  return (
    <div className="kg-hud">
      {fx}
      <span key={beat} className={'kg-hero-tile ' + (beat ? 'kid-hop' : '')}>{p.hero || '🙂'}</span>
      <div className="kg-hud-mid">
        <b>{title}</b>
        <div className="kg-xp" aria-label={`Level ${lv}`}><span>LV {lv}</span><div><i style={{ width: xp + '%' }} /></div></div>
      </div>
      <div className="kg-hud-r">
        <span className="kg-coin">🪙 {score}</span>
        {p.childAge === '3-5'
          ? <span className="kg-mini">🥚 {(p.loot || []).length}</span>
          : <span className="kg-mini">{CHILD_SEQ.map(k => (p.childTests?.[k] ? '⭐' : '☆')).join('')}</span>}
      </div>
    </div>
  );
}

function EyeBanner({ eye }) {
  return (
    <div className="kg-eye" role="status">
      <span className="kg-eye-emo">🙈</span>
      <span>{tt(eye === 'R' ? 'coverLeft' : 'coverRight')}</span>
    </div>
  );
}

/* ---------------- distance: "power zone" ---------------- */
const ZONE = { none: ['👀', 'kZoneNone'], close: ['🐢', 'kZoneClose'], far: ['🐰', 'kZoneFar'], ok: ['⚡', 'kZoneOk'] };
const zoneMsg = z => [ZONE[z][0], tt(ZONE[z][1])];

function PowerCam({ d, hidden }) {
  const was = useRef(false);
  useEffect(() => { if (d.ok && !was.current && d.mode === 'camera') sfx.lock(); was.current = d.ok; }, [d.ok, d.mode]);
  // Voice coaching while out of range. Getting back in range only plays the lock chime, so it never talks over
  // the game instruction that starts at that moment.
  const zoneKey = hidden || d.mode !== 'camera' || d.loading || d.ok ? null : d.zone;
  const [held, setHeld] = useState(null);
  useEffect(() => { const t = setTimeout(() => setHeld(zoneKey), 700); return () => clearTimeout(t); }, [zoneKey]);
  const lastZone = useRef(null);
  const voiceOn = useStore(app, s => s.voiceOn);
  useEffect(() => {
    if (held === lastZone.current) return;
    lastZone.current = held;
    if (held && voiceOn) A.say(tt(ZONE[held][1]));
  }, [held, voiceOn]);
  const cm = d.mm ? Math.round(d.mm / 10) : null;
  const pos = cm == null ? null : Math.max(0, Math.min(100, ((cm - 20) / 40) * 100)); // 20 cm … 60 cm
  const [emo, msg] = d.mode === 'manual' ? ['📏', tt('kZoneManual', { cm: TARGET_CM })]
    : d.loading ? ['📷', tt('kCamStarting')] : zoneMsg(d.zone);
  return (
    // Always mounted (only hidden), so the camera stream stays attached to this <video> between screens.
    <div className={'kg-power ' + (d.mode === 'camera' && !d.loading ? (d.ok ? 'ok' : 'off') : '')} style={hidden ? { display: 'none' } : undefined}>
      <div className="kg-lens">
        <video ref={d.cam.videoRef} playsInline muted autoPlay aria-label="Camera preview" style={{ display: d.mode === 'camera' ? 'block' : 'none' }} />
        {d.mode !== 'camera' && <span>📏</span>}
      </div>
      <div className="kg-power-body">
        <div className="kg-power-msg"><span aria-hidden="true">{emo}</span> {msg}</div>
        {d.mode === 'camera' && !d.loading && (
          <div className="kg-meter" aria-label={cm ? cm + ' cm' : 'no reading'}>
            <i className="band" />{pos != null && <b style={{ left: pos + '%' }} />}<small>{cm ? cm + ' cm' : '—'}</small>
          </div>
        )}
        {d.mode === 'camera' && <button className="lnk xs" onClick={d.playWithoutCamera}>{tt('kNoCam')}</button>}
      </div>
    </div>
  );
}

/* Replaces the test card while the child is out of range: no answer is ever taken at the wrong distance. */
function Paused({ d }) {
  const [emo, msg] = d.loading ? ['📷', tt('kCamStarting')] : zoneMsg(d.zone);
  return (
    <div className="kid-paused" role="status">
      <span className="kid-paused-emo">{emo}</span><b>{msg}</b><small>{tt('kPaused')}</small>
    </div>
  );
}

/* ---------------- Chomp Canyon (ages 6–10, Landolt ring) ----------------
   The ring is the chomper's mouth. Swipe on the card, or tap the food button on the side the mouth opens. */
function useSwipe(onDir, enabled) {
  const start = useRef(null);
  return {
    onPointerDown: e => { if (enabled) start.current = [e.clientX, e.clientY]; },
    onPointerUp: e => {
      const s = start.current; start.current = null;
      if (!enabled || !s) return;
      const dx = e.clientX - s[0], dy = e.clientY - s[1];
      if (Math.max(Math.abs(dx), Math.abs(dy)) < 40) return;
      onDir(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up'));
    },
    style: { touchAction: 'none' },
  };
}

function ChompArena({ dir, size, label, d, fb, food, onAns, cant, disabled }) {
  const live = d.ok && !fb && !disabled;
  const swipe = useSwipe(onAns, live);
  const btn = k => (
    <button className={'kg-food ' + k} style={{ '--c': DIR_COL[k] }} aria-label={'Feed ' + k} disabled={!live} onClick={() => onAns(k)}>
      <span className="kg-food-emo">{food}</span>
      <span className="kg-food-arrow" style={{ transform: `rotate(${DIR_ROT[k]}deg)` }}>▲</span>
    </button>
  );
  return (
    <>
      <div className="kg-arena">
        {btn('up')}
        <div className="kg-row">
          {btn('left')}
          <div className="tcard kg-card" {...swipe}>
            {!d.ok ? <Paused d={d} />
              : fb ? <ChompFeedback fb={fb} />
              : <>{label && <span className="lv">{label}</span>}<LandoltRing dir={dir} size={size} /></>}
          </div>
          {btn('right')}
        </div>
        {btn('down')}
      </div>
      <p className="kg-hint">{tt('kSwipe', { food })}</p>
      {cant && <div className="center"><button className="kg-btn ghost" disabled={!live} onClick={() => onAns('cant')}>{tt('kCant')}</button></div>}
    </>
  );
}

function ChompFeedback({ fb }) {
  if (fb.kind === 'hit') {
    const [x, y] = DIR_VEC[fb.dir];
    return (
      <div className="kg-fb">
        <span className="kg-fly" style={{ '--x': x * -120 + 'px', '--y': y * -120 + 'px' }}>{fb.food}</span>
        <b className="kg-fb-big">{tt('kChompHit')}</b>
      </div>
    );
  }
  return <div className="kg-fb"><b className="kg-fb-big soft">{tt('kWhoosh')}</b></div>;
}

/* ---------------- Egg Island (ages 3–5, LEA symbols) ----------------
   The test card shows the picture; tap the egg with the same picture to hatch a creature. */
function EggArena({ sym, size, label, d, fb, opts, onAns, cant, disabled }) {
  const live = d.ok && !fb && !disabled;
  return (
    <>
      <div className="tcard kg-card">
        {!d.ok ? <Paused d={d} />
          : fb ? <EggFeedback fb={fb} />
          : <>{label && <span className="lv">{label}</span>}<LeaSym k={sym} size={size} /></>}
      </div>
      <p className="kg-hint">{tt('kEggTap')}</p>
      <div className="kg-eggs">
        {opts.map((k, i) => (
          <button key={k} className="kg-egg" style={{ '--c': EGG_COL[i % EGG_COL.length] }} aria-label={LEA_NAME[k]} disabled={!live} onClick={() => onAns(k)}>
            <span className="kg-egg-win"><LeaSym k={k} size={40} /></span>
          </button>
        ))}
      </div>
      {cant && <div className="center"><button className="kg-btn ghost" disabled={!live} onClick={() => onAns('cant')}>{tt('kCant')}</button></div>}
    </>
  );
}

function EggFeedback({ fb }) {
  if (fb.kind === 'hit') return <div className="kg-fb"><span className="kg-hatch">{fb.creature}</span><b className="kg-fb-big">{tt('kHatched')}</b></div>;
  return <div className="kg-fb"><b className="kg-fb-big soft">{tt('kPop')}</b></div>;
}

/* ---------------- entry overlay (parent, from the home card) ---------------- */
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
        <span className="kid-float" style={{ fontSize: 64 }}>🎮</span>
        <h2 className="h2" id="kidt" style={{ marginTop: 6 }}>{tt('childMode')}</h2>
        <p className="muted small">{tt('kEntrySub')}</p>
        <label className="fld" style={{ textAlign: 'left', marginTop: 12 }}>
          <span>{tt('childNameQ')}</span>
          <input className="kid-name" value={name} maxLength={40} placeholder={tt('kNamePh')} onChange={e => setName(e.target.value)} />
        </label>
        <p style={{ marginTop: 16, fontWeight: 700 }}>{tt('childAgeQ')}</p>
        <div className="kid-age">
          <button aria-pressed={band === '3-5'} onClick={() => { sfx.pick(); setBand('3-5'); }}><span>🥚</span>{tt('childAge35')}<small>{tt('kEggIsland')}</small></button>
          <button aria-pressed={band === '6-10'} onClick={() => { sfx.pick(); setBand('6-10'); }}><span>🦖</span>{tt('childAge610')}<small>{tt('kChomp')}</small></button>
        </div>
        <button className="btn p big w" style={{ marginTop: 18 }} disabled={!band} onClick={() => { onClose?.(); A.startChildMode(band, name); }}>
          {tt('kLetsGo')} <Icon n="fwd" />
        </button>
      </div>
    </div>
  );
}

/* ---------------- parent questions (unchanged content) ---------------- */
// Question text is T['kQ_' + id]; answer labels are kYes / kNo / kSometimes / kUnsure.
const PARENT_Q = [
  { id: 'sq_tv', o: ['yes', 'no', 'sometimes'] },
  { id: 'sq_squint', o: ['yes', 'no', 'sometimes'] },
  { id: 'sq_turn', o: ['yes', 'no', 'unsure'] },
  { id: 'sq_family', o: ['yes', 'no', 'unsure'] },
];
const ANS_KEY = { yes: 'kYes', no: 'kNo', sometimes: 'kSometimes', unsure: 'kUnsure' };

export function ChildParentQ() {
  const p = useP(); useLang();
  const [i, setI] = useState(0);
  const q = PARENT_Q[i], val = p.parentAnswers[q.id], last = i === PARENT_Q.length - 1;
  const spoken = (i === 0 ? named(p, 'kPQLead', 'kPQLeadAnon') + ' ' : '') + tt('kQ_' + q.id);
  useSay('pq' + i, spoken);
  return (
    <div className="wrap n">
      <div className="kid-dots" aria-label={`Question ${i + 1} of ${PARENT_Q.length}`}>{PARENT_Q.map((x, k) => <i key={x.id} className={k <= i ? 'on' : ''} />)}</div>
      <div className="talk">
        <Mascot s={64} />
        <div className="bubble">
          <div className="lead">{named(p, 'kPQLead', 'kPQLeadAnon')}</div>
          <h2>{tt('kQ_' + q.id)}</h2>
          <button className="spk" aria-label={tt('listen')} onClick={() => A.say(spoken)}><Icon n="spk" /></button>
        </div>
      </div>
      <div className="tiles">
        {q.o.map((v, k) => (
          <button key={v} className="tile" aria-pressed={val === v} onClick={() => A.setParentAnswer(q.id, v)}>
            <span className="tick"><Icon n="check" /></span><span className={'blob c-' + PAL[k % PAL.length]}><Icon n={v === 'yes' ? 'check' : v === 'no' ? 'x' : 'list'} /></span>{tt(ANS_KEY[v])}
          </button>
        ))}
      </div>
      <div className="qfoot">
        {i > 0 ? <button className="btn" aria-label={tt('back')} onClick={() => setI(i - 1)}><Icon n="back" /></button> : <span style={{ width: 52 }} />}
        <span />
        {last
          ? <button className="btn p" disabled={!val} onClick={A.doneParentQ}>{named(p, 'kHandOver', 'kHandOverAnon')} <Icon n="fwd" c="s" /></button>
          : <button className="btn p" disabled={!val} onClick={() => setI(i + 1)}>{tt('next')} <Icon n="fwd" c="s" /></button>}
      </div>
    </div>
  );
}

/* ---------------- hero select + training camp (doesn't count) ---------------- */
export function ChildPractice() {
  const p = useP(); useLang();
  const young = p.childAge === '3-5';
  const d = useKidDistance(); // asks for the camera here, so the real test starts straight away
  const [phase, setPhase] = useState(p.hero ? 'train' : 'hero');
  const [target, setTarget] = useState(() => (young ? pick(['house', 'circle', 'apple']) : randDir()));
  const [hits, setHits] = useState(0);
  const [fb, setFb] = useState(null);
  const [won, setWon] = useState(false);
  const [food] = useState(() => rnd(FOODS));
  const [pops, pop] = usePops();

  const onAns = a => {
    if (fb || won) return;
    if (a !== target) { sfx.soft(); setFb({ kind: 'miss' }); setTimeout(() => setFb(null), FB_MS); return; } // try again, no penalty
    const creature = rnd(CREATURES);
    if (young) sfx.hatch(); else sfx.chomp();
    setFb({ kind: 'hit', dir: a, food, creature }); pop('+5 🪙'); A.addScore(5);
    const n = hits + 1; setHits(n);
    setTimeout(() => {
      setFb(null);
      if (n >= 2) { setWon(true); sfx.levelUp(); setTimeout(A.passPractice, 1800); return; }
      setTarget(young ? pick(['house', 'circle', 'apple'], target) : randDir(target));
    }, FB_MS);
  };

  useSay('hero', tt('ks_hero', { name: kidName(p) }), phase === 'hero');
  useSay('train', distHint(d) + tt(young ? 'ks_trainEgg' : 'ks_trainChomp'), phase === 'train' && d.ok && !won);
  useSay('won', tt('ks_trainDone'), won);

  // PowerCam keeps the same place in the tree in both phases, so its <video> (and the camera stream) survives.
  return (
    <Shell theme="sky">
      <PowerCam d={d} hidden={phase === 'hero'} />
      {phase === 'hero' ? <>
        <div className="kg-title">{tt('kChooseHero')}</div>
        <p className="kg-sub">{tt('kHeroSub', { name: kidName(p) })}</p>
        <div className="kg-heroes">
          {HEROES.map(([h, n]) => (
            <button key={h} className={'kg-hero ' + (p.hero === h ? 'on' : '')} onClick={() => { sfx.pick(); A.setHero(h); }}>
              <span>{h}</span><b>{n}</b>
            </button>
          ))}
        </div>
        <div className="center" style={{ marginTop: 18 }}>
          <button className="kg-btn go" disabled={!p.hero} onClick={() => { sfx.go(); setPhase('train'); }}>{tt('kPlay')}</button>
        </div>
      </> : <>
      <Hud title={'🏕️ ' + tt('kTraining')} beat={hits} fx={pops} />
      <div className="kg-quest">
        <span>{tt('kQuest')}</span>
        {tt(young ? 'kQuestEgg' : 'kQuestChomp')}
        <b>{hits}/2</b>
      </div>
      {won ? (
        <div className="tcard kg-card kid-reward"><Confetti /><div className="kid-banner">{tt('kTrainDone')}</div></div>
      ) : young
        ? <EggArena sym={target} size={110} d={d} fb={fb} opts={['house', 'circle', 'apple', 'star']} onAns={onAns} />
        : <ChompArena dir={target} size={80} d={d} fb={fb} food={food} onAns={onAns} />}
      </>}
    </Shell>
  );
}

/* ---------------- the real VA test ---------------- */
const START_LEVEL = 2; // 6/24

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
  const [fb, setFb] = useState(null);
  const [food, setFood] = useState(() => rnd(FOODS));
  const [pops, pop] = usePops();
  const busy = useRef(false);

  const reset = () => { setLevel(START_LEVEL); setCorrect(0); setBest(-1); setFellBack(false); setTarget(nextTarget()); setStage(1); setStreak(0); };

  function finishEye(b) {
    if (eye === 'R') {
      setRTmp(b); setBetween(true); sfx.levelUp();
      setTimeout(() => { setEye('L'); reset(); setBetween(false); }, 2200);
    } else onDone({ R: rTmp, L: b, ...dist(d) });
  }

  // Same rule as the adult AcuityRings test; only the feedback is different.
  function judge(a) {
    if (a === target) {
      const n = correct + 1;
      if (n >= 2) {
        if (level >= VA.length - 1) { A.addScore(50); return finishEye(level); }
        setBest(level); setLevel(level + 1); setCorrect(0); setTarget(nextTarget());
        setStage(st => st + 1); setLevelUp(x => x + 1); setTimeout(sfx.levelUp, 100);
      } else { setCorrect(n); setTarget(nextTarget(target)); }
      return;
    }
    // Missed the first (6/24) level before passing anything: drop to 6/60 and climb with the same rule,
    // so a child who can't see 6/24 is measured rather than recorded as "worse than 6/60".
    if (best < 0 && level === START_LEVEL && !fellBack) { setFellBack(true); setLevel(0); setCorrect(0); setTarget(nextTarget()); return; }
    finishEye(best);
  }

  function onAns(a) {
    if (busy.current) return;
    busy.current = true;
    d.mark();
    const hit = a === target;
    if (hit) {
      const s = streak + 1, coins = 10 * Math.min(s, 3);
      setStreak(s); setBeat(x => x + 1); A.addScore(coins);
      pop(`+${coins} 🪙`); if (s >= 3) setTimeout(() => pop(tt('kCombo', { n: Math.min(s, 3) }), 'combo'), 150);
      if (young) { const c = rnd(CREATURES); A.addLoot(c); sfx.hatch(); setFb({ kind: 'hit', creature: c }); }
      else { sfx.chomp(); setFb({ kind: 'hit', dir: a, food }); }
    } else { setStreak(0); sfx.whoosh(); setFb({ kind: 'miss' }); }
    // Show the feedback first, then move on: the next optotype never appears under an animation.
    setTimeout(() => { setFb(null); setFood(rnd(FOODS)); judge(a); busy.current = false; }, FB_MS);
  }

  const world = young ? '🥚 ' + tt('kEggIsland') : '🦖 ' + tt('kChomp');
  useSay('va-' + eye, distHint(d) + tt(eye === 'R' ? 'ks_coverL' : 'ks_coverR') + ' ' + tt(young ? 'ks_vaEgg' : 'ks_vaChomp'), !between && d.ok);
  useSay('va-between', tt('ks_worldClear', { n: 1 }), between);
  useSay('stage-' + eye + stage, tt('ks_stage', { n: stage }), stage > 1 && !between && d.ok);
  return (
    <Shell theme={young ? 'island' : 'canyon'}>
      <Hud title={`${world} · ${eye === 'R' ? '1' : '2'}-${stage}`} beat={beat}
        fx={<>{pops}{levelUp > 0 && <div key={levelUp} className="kid-levelup" aria-hidden="true">{tt('kStage', { n: stage })}</div>}</>} />
      <PowerCam d={d} hidden={between} />
      {between ? (
        <div className="tcard kg-card kid-reward">
          <Confetti />
          <div className="kid-banner">{tt('kWorldClear', { n: eye === 'R' ? 1 : 2 })}</div>
          <p className="kg-sub" style={{ color: '#333' }}>{tt('kSwitchHands')}</p>
        </div>
      ) : <>
        <EyeBanner eye={eye} />
        {young
          ? <EggArena sym={target} size={VA_PX[level]} label={VA[level]} d={d} fb={fb} opts={LEA_TEST} onAns={onAns} cant />
          : <ChompArena dir={target} size={VA_PX[level]} label={VA[level]} d={d} fb={fb} food={food} onAns={onAns} cant />}
      </>}
    </Shell>
  );
}

/* ---------------- Glitch Grid (Amsler) ----------------
   Stare challenge first (3-2-1 on the centre dot), then flag wobbly blocks. Same coins whatever is flagged. */
function ChildAmsler({ state, d, onDone }) {
  const [eye, setEye] = useState(state.eye ?? 'R');
  const [marks, setMarks] = useState([]);
  const [rCount, setRCount] = useState(state.R ?? 0);
  const [between, setBetween] = useState(false);
  const [count, setCount] = useState(3);
  const [pops, pop] = usePops();
  const speaking = useStore(voiceState, s => s.speaking);
  const staring = count > 0;
  useSay('am-stare-' + eye, distHint(d) + tt(eye === 'R' ? 'ks_coverL' : 'ks_coverR') + ' ' + tt('ks_stare'), !between && staring && d.ok);
  useSay('am-flag-' + eye, tt('ks_flag'), !between && !staring && d.ok);
  useSay('am-between', tt('ks_gridDone', { n: 1 }), between);

  // Countdown only runs while the child is in the power zone, and starts once Drishti has finished talking.
  useEffect(() => {
    if (between || count <= 0 || !d.ok || speaking) return undefined;
    const t = setTimeout(() => { setCount(c => c - 1); if (count === 1) sfx.go(); else sfx.tick(); }, 900);
    return () => clearTimeout(t);
  }, [count, between, d.ok, speaking]);

  const toggle = i => { sfx.boop(); setMarks(m => (m.includes(i) ? m.filter(x => x !== i) : [...m, i])); };
  function finishEye(n) {
    d.mark(); A.addScore(30); sfx.coin(); pop('+30 🪙');
    if (eye === 'R') {
      setRCount(n); setBetween(true); sfx.levelUp();
      setTimeout(() => { setEye('L'); setMarks([]); setCount(3); setBetween(false); }, 2200);
    } else onDone({ R: rCount, L: n, ...dist(d) });
  }
  return (
    <Shell theme="glitch">
      <Hud title={`👾 ${tt('kGlitch')} · ${eye === 'R' ? 1 : 2}`} fx={pops} />
      <PowerCam d={d} hidden={between} />
      {between ? (
        <div className="tcard kg-card kid-reward"><Confetti /><div className="kid-banner">{tt('kGridScanned', { n: eye === 'R' ? 1 : 2 })}</div><p className="kg-sub" style={{ color: '#333' }}>{tt('kOtherEye')}</p></div>
      ) : <>
        <EyeBanner eye={eye} />
        <div className={'kg-quest ' + (staring ? 'stare' : '')}>
          {staring
            ? <><span>{tt('kStareTag')}</span>{tt('kStare')} <b className="kg-count">{count}</b></>
            : <><span>{tt('kFlagTag')}</span>{tt('kFlag')}</>}
        </div>
        <div className="tcard kg-card">
          {!d.ok ? <Paused d={d} /> : (
            <div className={'amsler kg-amsler ' + (staring ? 'locked' : '')} role="group" aria-label="Amsler grid">
              {Array.from({ length: 196 }, (_, i) => <button key={i} data-v={i} disabled={staring} aria-pressed={marks.includes(i)} aria-label={`Square ${i + 1}`} onClick={() => toggle(i)} />)}
            </div>
          )}
        </div>
        <div className="kg-choice">
          <button className="kg-btn green" disabled={!d.ok || staring || marks.length > 0} onClick={() => finishEye(0)}>{tt('kAllStraight')}</button>
          <button className="kg-btn orange" disabled={!d.ok || staring || marks.length === 0} onClick={() => finishEye(marks.length)}>{tt('kDoneFlag')}</button>
        </div>
      </>}
    </Shell>
  );
}

/* Extra fields on the test result: how far away the child was. cleanTests() keeps them; R and L are unchanged. */
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

/* ---------------- world map between missions + treasure chest at the end ---------------- */
export function ChildReward() {
  const p = useP(); useLang();
  const young = p.childAge === '3-5';
  const done = CHILD_SEQ.filter(k => p.childTests?.[k]).length;
  const allDone = done === CHILD_SEQ.length;
  const nodes = [['🏕️', tt('kTraining')], young ? ['🥚', tt('kEggIsland')] : ['🦖', tt('kChomp')], ['👾', tt('kGlitch')], ['🎁', tt('kTreasure')]];
  const [at, setAt] = useState(done);        // hero starts on the mission just finished…
  const [open, setOpen] = useState(false);
  useEffect(() => {
    A.resumeChild();
    const t1 = setTimeout(() => { setAt(done + 1); sfx.pick(); }, 700); // …then hops to the next one
    const t2 = allDone ? setTimeout(() => { setOpen(true); sfx.chest(); }, 1600) : null;
    if (!allDone) sfx.levelUp();
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const pct = n => 13 + (n / (nodes.length - 1)) * 74;
  useSay('reward-' + done, allDone ? tt('ks_beat', { name: kidName(p) }) : tt('ks_mission', { x: nodes[done + 1][1] }));
  return (
    <Shell theme="sky">
      <div className="kg-title">{tt(allDone ? 'kBeatGame' : 'kMissionDone')}</div>
      <div className="kg-map">
        <div className="kg-path" />
        {nodes.map(([e, n], i) => (
          <div key={n} className={'kg-node ' + (i <= done ? 'done' : '') + (i === at ? ' here' : '')} style={{ left: pct(i) + '%' }}>
            <span>{e}</span><small>{n}</small>
          </div>
        ))}
        <span className="kg-map-hero" style={{ left: pct(Math.min(at, nodes.length - 1)) + '%' }}>{p.hero || '🙂'}</span>
      </div>
      {allDone ? (
        <div className="kg-chest-wrap">
          {open && <Confetti n={70} />}
          <span className={'kg-chest ' + (open ? 'open' : '')}>{open ? '🏆' : '🎁'}</span>
          {open && <div className="kg-badge">{tt('kBadge')}</div>}
          <h2 className="kg-sub big">{named(p, 'childStar', 'kStarAnon')}</h2>
          <div className="kg-loot">
            <span className="kg-coin big">🪙 {p.score || 0}</span>
            {young && (p.loot || []).length > 0 && <span className="kg-zoo">{(p.loot || []).slice(-8).join(' ')}</span>}
          </div>
        </div>
      ) : (
        <div className="center" style={{ marginTop: 10 }}>
          <span className="kid-star" aria-hidden="true">⭐</span>
          <h2 className="kg-sub big">{named(p, 'childStar', 'kStarAnon')}</h2>
          <span className="kg-coin big">🪙 {p.score || 0}</span>
          <p className="kg-sub">{tt('kNextUp', { x: nodes[done + 1][1] + ' ' + nodes[done + 1][0] })}</p>
        </div>
      )}
    </Shell>
  );
}
