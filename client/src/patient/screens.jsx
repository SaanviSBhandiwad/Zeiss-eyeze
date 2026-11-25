import { useEffect, useRef, useState } from 'react';
import {
  QMAP, SCENE, SEC_COL, PAL, LENS, COAT, NEXT, CMAP, DOC, TIPS, TIP_IC, visibleQs, ansLabel, tx, replyText, testRows,
} from '../shared/index.js';
import { ICO } from '../lib/icons.js';
import { Icon, Mascot, toast, ago, fmtDate, fmtTime } from '../lib/ui.jsx';
import { useStore } from '../lib/store.js';
import * as A from './state.js';
import { TESTS, TEST_IC, VA, VA_PX } from './tests/constants.js';
import { LandoltRing, randDir } from './tests/utils.jsx';
import { AcuityRings, ContrastTest, ColourPlates, AmslerGrid, AstigmatismDial, NearPoint, PupilDistance, SetupCalibration, NearReading } from './tests/index.js';

const { app, tt } = A;
const useP = () => useStore(app, s => s.p);
const useLang = () => useStore(app, s => s.lang);

/* ---------------- home ---------------- */
export function Home() {
  useLang();
  const [showChildEntry, setShowChildEntry] = useState(false);
  const how = [['mic', 'teal'], ['list', 'indigo'], ['eye', 'gold'], ['file', 'sky'], ['users', 'coral']];
  return (
    <div className="wrap">
      <div className="hero">
        <div>
          <h1 dangerouslySetInnerHTML={{ __html: tt('heroH2') }} />
          <p>{tt('heroP2')}</p>
          <div className="row wr"><button className="btn p big" onClick={() => A.startMode('full')}>{tt('start')} <Icon n="fwd" /></button></div>
        </div>
        <svg className="heroart" viewBox="0 0 400 360" aria-hidden="true">
          {/* bg blobs */}
          <circle cx="200" cy="180" r="155" fill="var(--teal-soft)" opacity="0.85"/>
          <circle cx="62" cy="72" r="30" fill="var(--indigo-soft)"/>
          <circle cx="338" cy="296" r="42" fill="var(--teal-soft)" opacity="0.6"/>
          <circle cx="346" cy="62" r="18" fill="var(--gold-soft)"/>
          {/* sparkle stars — 4-pointed, staggered */}
          <g className="hero-sp sp1"><path d="M330 85l3 8 8 3-8 3-3 8-3-8-8-3 8-3z" fill="var(--gold)"/></g>
          <g className="hero-sp sp2"><path d="M66 243l2.5 6 6 2.5-6 2.5-2.5 6-2.5-6-6-2.5 6-2.5z" fill="var(--teal)"/></g>
          <g className="hero-sp sp3"><circle cx="362" cy="180" r="5" fill="var(--gold)"/></g>
          <g className="hero-sp sp4"><circle cx="40" cy="200" r="4" fill="var(--indigo)"/></g>
          <g className="hero-sp sp5"><path d="M310 260l2 5 5 2-5 2-2 5-2-5-5-2 5-2z" fill="var(--indigo)" opacity="0.7"/></g>
          {/* eye white */}
          <path d="M68 185c33-57 78-86 132-86s99 29 132 86c-33 57-78 86-132 86S101 242 68 185z" fill="var(--surface)"/>
          <path d="M68 185c33-57 78-86 132-86s99 29 132 86c-33 57-78 86-132 86S101 242 68 185z" fill="none" stroke="var(--teal)" strokeWidth="5" strokeLinejoin="round"/>
          {/* iris + pupil */}
          <circle cx="200" cy="185" r="58" fill="var(--teal)"/>
          <circle cx="200" cy="185" r="26" fill="#0d47a1"/>
          <circle cx="218" cy="168" r="13" fill="rgba(255,255,255,0.4)"/>
          <circle cx="183" cy="203" r="7" fill="rgba(255,255,255,0.15)"/>
          {/* lashes */}
          <g stroke="var(--teal)" strokeWidth="3.5" strokeLinecap="round">
            <line x1="200" y1="96" x2="200" y2="82"/>
            <line x1="168" y1="104" x2="163" y2="91"/>
            <line x1="232" y1="104" x2="237" y2="91"/>
          </g>
        </svg>
      </div>
      <div className="bigcards" style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}>
        <button className="bc t1" onClick={() => A.startMode('full')}><span className="ico"><Icon n="eye" c="l" /></span><b>{tt('fullCheck')}</b><span><Icon n="clock" c="s" /> {tt('mins', { n: 12 })}</span></button>
        <button className="bc t2" onClick={() => A.startMode('profile')}><span className="ico"><Icon n="mic" c="l" /></span><b>{tt('card2')}</b><span><Icon n="clock" c="s" /> {tt('mins', { n: 5 })}</span></button>
        <button className="bc t3" onClick={() => A.startMode('tests')}><span className="ico"><Icon n="mobile" c="l" /></span><b>{tt('card3')}</b><span><Icon n="clock" c="s" /> {tt('mins', { n: 7 })}</span></button>
        <button className="bc" style={{ background: 'var(--coral-soft)' }} onClick={() => setShowChildEntry(true)}>
          <span className="ico" style={{ color: 'var(--coral)' }}><Icon n="users" c="l" /></span>
          <b>{tt('childMode')}</b>
          <span><Icon n="clock" c="s" /> {tt('mins', { n: 5 })} · 3–10</span>
        </button>
      </div>
      {showChildEntry && <ChildModeEntry onClose={() => setShowChildEntry(false)} />}
      <div className="how">{how.map(([i, c], k) => <div key={i}><span className={'ico c-' + c}><Icon n={i} /></span><b>{tt('hw' + (k + 1))}</b><span>{tt('hs' + (k + 1))}</span></div>)}</div>
      <p className="foot">{tt('disclaimer')}<br /><a href="/optometrist">Optometrist login</a></p>
    </div>
  );
}

/* ---------------- consent ---------------- */
export function Consent() {
  useLang();
  return (
    <div className="wrap n"><div className="card center">
      <Mascot s={110} />
      <h2 className="h2" style={{ marginTop: 14 }}>{tt('cTitle')}</h2>
      <div className="consent">
        <div className="c-gold"><Icon n="clock" />{tt('c1')}</div>
        <div className="c-teal"><Icon n="mic" />{tt('c2')}</div>
        <div className="c-indigo"><Icon n="lock" />{tt('c3')}</div>
      </div>
      <div className="row" style={{ justifyContent: 'center' }}><button className="btn sm" onClick={() => A.say(tt('consentSay'))}><Icon n="spk" c="s" /> {tt('listen')}</button></div>
      <div style={{ marginTop: 20 }}><button className="btn p big" onClick={A.agree}>{tt('letsGo')} <Icon n="fwd" /></button></div>
    </div></div>
  );
}

/* ---------------- interview ---------------- */
function OtherInput({ value }) {
  const ref = useRef(null);
  useEffect(() => { ref.current?.focus(); }, []);
  return (
    <input
      ref={ref}
      style={{ width: '100%', minHeight: 54, padding: '0 16px', fontSize: 18, borderRadius: 16, border: '2px solid var(--teal)', background: 'var(--surface-2)', marginTop: 12, boxSizing: 'border-box' }}
      placeholder="Describe your answer here…"
      value={value}
      onChange={e => A.setText(e.target.value)}
    />
  );
}

function BubbleLead({ q, p }) {
  const [, force] = useState(0);
  useEffect(() => { const i = setTimeout(() => force(x => x + 1), 2600); return () => clearTimeout(i); }, [p.ackAt]);
  const last = p.qhist[p.qhist.length - 1];
  let lead = '';
  if (last && QMAP[last].sec !== q.sec) lead = tt('secIn_' + q.sec);
  else if (q.lead) lead = tx(q.lead, A.L());
  else if (q.parent && p.answers[q.parent] !== undefined) lead = tt('youSaid', { x: ansLabel(QMAP[q.parent], p.answers[q.parent], A.L()) });
  const ack = Date.now() - p.ackAt < 2500 && p.qhist.length;
  if (!ack && !lead) return null;
  return <div className="lead">{ack ? <span className="ack"><Icon n="check" c="s" /> {tt('ack')}</span> : null}{ack && lead ? ' · ' : ''}{lead}</div>;
}

function HoursDial({ q, v }) {
  const icn = q.id === 'phone' ? 'mobile' : q.id === 'outdoor' ? 'sun' : 'book';
  return (
    <div className="dial2">
      <div className="bignum"><span>{v}</span><small>{tt('hrs')}</small></div>
      <div className="suns">{Array.from({ length: 12 }, (_, i) => (
        <i key={i} className={`${i < v ? 'on' : ''} ${q.id === 'phone' ? 'ph' : ''}`}>{i < v ? <svg viewBox="0 0 24 24" dangerouslySetInnerHTML={{ __html: ICO[icn] }} /> : null}</i>
      ))}</div>
      <div className="dlbl"><span>0</span><span>6</span><span>12</span></div>
      <input type="range" min="0" max="12" step="1" value={v} aria-label={tt('hrs')} onChange={e => A.setVal(+e.target.value)} />
      <div className="chipsrow">{[0, 1, 2, 4, 6, 8, 10].map(n => <button key={n} onClick={() => A.setVal(n)}>{n}</button>)}</div>
    </div>
  );
}

function AgeDial({ v }) {
  const clamp = n => Math.max(5, Math.min(95, n));
  return (
    <div className="dial2">
      <div className="stepper">
        <button aria-label="minus" onClick={() => A.setVal(clamp(v - 1))}>−</button>
        <div className="bignum"><span>{v}</span><small>{tt('yrsW')}</small></div>
        <button aria-label="plus" onClick={() => A.setVal(clamp(v + 1))}>+</button>
      </div>
      <input type="range" min="5" max="95" step="1" value={v} aria-label={tt('age')} onChange={e => A.setVal(+e.target.value)} />
      <div className="chipsrow">{[15, 25, 35, 45, 55, 65, 75].map(n => <button key={n} onClick={() => A.setVal(n)}>{n}</button>)}</div>
    </div>
  );
}

export function Interview() {
  const p = useP(), lang = useLang();
  const q = A.nextQ(p);
  if (!q) return null;
  const vis = visibleQs(p.answers), secs = ['eyes', 'day', 'health'], si = secs.indexOf(q.sec), col = SEC_COL[q.sec];
  const pct = Math.round(p.qhist.length / vis.length * 100);
  let body = null, canNext = false, showNext = false;

  if (q.type === 'single' || q.type === 'multi') {
    const sel = q.type === 'multi' ? (p.multiSel || []) : (p.pick ? [p.pick] : []);
    const otherSel = sel.includes('other');
    body = <>
      {q.type === 'multi' && <p className="muted center" style={{ margin: '-8px 0 12px' }}>{tt('tapAll')}</p>}
      <div className={`tiles ${q.o.length === 4 || q.o.length === 2 ? 'c2' : ''}`}>
        {q.o.map((o, i) => (
          <button key={o.v} className="tile" aria-pressed={sel.includes(o.v)} onClick={() => A.tapOpt(o.v)}>
            <span className="tick"><Icon n="check" /></span><span className={'blob c-' + PAL[i % PAL.length]}><Icon n={o.ic} /></span>{tx(o.l, lang)}
          </button>
        ))}
        <button className="tile" aria-pressed={otherSel} onClick={() => A.tapOpt('other')}>
          <span className="tick"><Icon n="check" /></span>
          <span className="blob" style={{ background: 'var(--surface-2)', fontSize: 28, lineHeight: 1 }}>✏️</span>
          Others
        </button>
      </div>
      {otherSel && (
        <OtherInput value={p.text} />
      )}
    </>;
    // show Next for multi, OR for single when Others is selected (needs text then submit)
    showNext = q.type === 'multi' || otherSel;
    canNext = otherSel ? p.text.trim().length > 0 : sel.length > 0;
  } else if (q.type === 'hours') {
    body = <HoursDial q={q} v={p.val ?? A.initVal(q)} />; showNext = canNext = true;
  } else if (q.type === 'age') {
    body = <AgeDial v={p.val ?? 40} />; showNext = canNext = true;
  } else if (q.type === 'scene') {
    const sel = p.multiSel || [];
    body = <>
      <div className="scene">
        <div className="me"><Icon n="person" c="xl" /><span>{tt('you')}</span></div>
        {['near', 'mid', 'far'].map(z => (
          <div key={z} className={'zcol ' + z}>
            <h3>{tt('z_' + z)}</h3><div className="dst">{tt('zr_' + z)}</div>
            {SCENE.filter(s => s.z === z).map(s => (
              <button key={s.v} className="sitem" aria-pressed={sel.includes(s.v)} onClick={() => A.sceneItem(s.v)}>
                <span className="bl">{tt('blurry')}</span><Icon n={s.ic} /><span>{tx(s.l, lang)}</span>
              </button>
            ))}
          </div>
        ))}
      </div>
      {sel.length === 0 && <div className="center" style={{ marginTop: 14 }}><button className="btn o" onClick={A.sceneClear}><Icon n="check" c="s" /> {tt('allClear')}</button></div>}
    </>;
    showNext = true; canNext = sel.length > 0;
  } else if (q.type === 'text') {
    body = <>
      <textarea className="notefield" rows={4} value={p.text} placeholder={tt('notePh')} aria-label={tx(q.t, lang)} maxLength={1000} onChange={e => A.setText(e.target.value)} />
      <div className="center" style={{ marginTop: 12 }}><button className="btn o" onClick={() => A.setAnswer(q.id, '')}><Icon n="check" c="s" /> {tt('nothingMore')}</button></div>
    </>;
    showNext = true; canNext = p.text.trim().length > 0;
  }

  const L = p.listening;
  const heard = L === 'rec'
    ? <div className="heard"><span className="wave"><i /><i /><i /><i /><i /></span> {tt('tapToStop')}</div>
    : L === 'busy' ? <div className="heard"><span className="wave"><i /><i /><i /><i /><i /></span> {tt('understanding')}</div>
    : p.heard?.q === q.id ? <div className="heard"><Icon n="mic" c="s" /><span>“{p.heard.text}”</span></div> : null;

  return (
    <div className="wrap n">
      <div className="path">{secs.map((s, i) => (
        <span key={s} className={i === si ? 'on' : i < si ? 'done' : ''} style={i === si ? { background: `var(--${SEC_COL[s]}-soft)`, color: `var(--${SEC_COL[s]})` } : undefined}>
          <i><Icon n={i < si ? 'check' : { eyes: 'eye', day: 'sun', health: 'heart' }[s]} c="s" /></i>{tt('sec_' + s)}
        </span>
      ))}</div>
      <div className="prog"><i style={{ width: pct + '%', background: `var(--${col})` }} /></div>
      <div className="talk">
        <Mascot s={64} />
        <div className="bubble">
          <BubbleLead q={q} p={p} />
          <h2 id="curq">{tx(q.t, lang)}</h2>
          <button className="spk" aria-label={tt('listen')} onClick={() => { const k = A.speakKey(app.get()); if (k) A.say(k[1]); }}><Icon n="spk" /></button>
        </div>
      </div>
      {body}
      {heard}
      <div className="qfoot">
        {p.qhist.length ? <button className="btn" aria-label={tt('back')} onClick={A.qback}><Icon n="back" /></button> : <span style={{ width: 52 }} />}
        <div className="micwrap">
          <button className={'mic ' + (L !== 'idle' ? 'on' : '')} aria-label={tt('speakNow')} disabled={L === 'busy'} onClick={A.startListen}><Icon n="mic" /></button>
          {tt('speakNow')}
        </div>
        {showNext
          ? <button className="btn p" disabled={!canNext} onClick={A.qnext}>{q.type === 'multi' || q.type === 'scene' ? tt('done') : tt('next')} <Icon n="fwd" c="s" /></button>
          : <span style={{ width: 52 }} />}
      </div>
    </div>
  );
}

/* ---------------- tests ---------------- */
const TEST_KEYS = { setup: 't_setup', va: 't_va', near: 't_near', np: 't_np', contrast: 't_contrast', color: 't_color', amsler: 't_amsler', astig: 't_astig', pd: 't_pd' };
const testName = k => tt(TEST_KEYS[k]) || k;

const TEST_COMPONENTS = {
  setup: SetupCalibration,
  va: AcuityRings,
  near: NearReading,
  np: NearPoint,
  pd: PupilDistance,
  contrast: ContrastTest,
  color: ColourPlates,
  amsler: AmslerGrid,
  astig: AstigmatismDial,
};

function TestSteps({ cur, tests }) {
  return (
    <div className="tsteps">
      {TESTS.map(k => (
        <span key={k} className={k === cur ? 'cur' : tests[k] ? 'done' : ''} title={testName(k)}>
          <Icon n={tests[k] && k !== cur ? 'check' : TEST_IC[k]} />
        </span>
      ))}
    </div>
  );
}

export function TestRunner() {
  const p = useP();
  const cur = p.cur, ts = p.ts, tests = p.tests || {};

  if (!cur) {
    // intro / menu
    const anyDone = Object.keys(tests).length > 0;
    return (
      <div className="wrap n"><div className="card center" style={{ padding: '44px 24px' }}>
        <Mascot s={90} />
        <h2 className="h2" style={{ marginTop: 12 }}>{tt('testsIntro')}</h2>
        <p className="muted" style={{ marginTop: 8 }}>{tt('testsSub2')}</p>
        <ul className="tlist" style={{ marginTop: 16, listStyle: 'none', padding: 0 }}>
          {TESTS.map((k, i) => (
            <li key={k}>
              <button className={tests[k] ? 'done' : ''} onClick={() => A.openTest(k)}>
                <span className={`blob c-${PAL[i % PAL.length]}`}>
                  <Icon n={tests[k] ? 'check' : TEST_IC[k]} />
                </span>
                {testName(k)}
              </button>
            </li>
          ))}
        </ul>
        <div style={{ marginTop: 20, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <button className="btn p big" onClick={A.startTests}>
            {anyDone ? tt('resumeTests') : tt('startTests')} <Icon n="fwd" />
          </button>
          {anyDone && (
            <button className="btn" onClick={A.retakeTests}>{tt('retakeTests')}</button>
          )}
        </div>
      </div></div>
    );
  }

  const n = TESTS.indexOf(cur) + 1;
  const Comp = TEST_COMPONENTS[cur];

  const inner = Comp
    ? <Comp state={ts || {}} onDone={result => A.doneTest(cur, result)} />
    : (
      <div className="card center" style={{ padding: 32 }}>
        <p>{cur} — coming soon</p>
        <button className="btn p" style={{ marginTop: 16 }} onClick={() => A.doneTest(cur, {})}>Skip</button>
      </div>
    );

  return (
    <div className="wrap n">
      <TestSteps cur={cur} tests={tests} />
      <div className="tgrid">
        <div className="tinfo">
          <div className="row">
            <Mascot s={52} />
            <span className="muted small">Test {n} of {TESTS.length}</span>
          </div>
          <h2>{testName(cur)}</h2>
        </div>
        {inner}
      </div>
    </div>
  );
}

// Keep original export name so PatientApp.jsx import doesn't break
export { TestRunner as TestsSoon };

/* ---------------- result ---------------- */
export function Result() {
  const p = useP(), lang = useLang();
  const r = p.result;
  if (!r) return null;
  const st = p.status;
  const isChild = p.mode === 'child' && r.isChild; // CHILD MODE
  const tests = (isChild ? p.childTests : p.tests) || {};
  const zc = { near: ['indigo', 'book'], mid: ['teal', 'monitor'], far: ['gold', 'mountain'] };
  const nowS = st === 'replied' ? 'replied' : st === 'review' ? 'review' : 'sent';
  const steps = [['sent', ['sent', 'review', 'replied'].includes(st)], ['review', ['review', 'replied'].includes(st)], ['replied', st === 'replied']];
  return (
    <div className="wrap">
      <div className="rep-h">
        <div>
          <h1>{isChild ? tt('childReportTitle', { name: p.childName }) : tt('reportTitle')}</h1>
          <div className="meta">{p.info.name ? p.info.name + ' · ' : ''}{isChild ? tt(p.childAge === '3-5' ? 'childAge35' : 'childAge610') + ' · ' : p.answers.age ? tt('yearsN', { n: p.answers.age }) + ' · ' : ''}{p.pid || ''} · {fmtDate(null, lang)}</div>
        </div>
        <div className="row">
          <button className="btn sm" onClick={A.listenProfile}><Icon n="spk" c="s" /> {tt('listen')}</button>
          <button className="btn sm" onClick={() => toast(tt('shared'))}><Icon n="share" c="s" /> {tt('share')}</button>
        </div>
      </div>
      <div className={'signal ' + r.tri}>
        <div className="lights" aria-hidden="true"><i className={'r ' + (r.tri === 'red' ? 'on' : '')} /><i className={'a ' + (r.tri === 'amber' ? 'on' : '')} /><i className={'g ' + (r.tri === 'green' ? 'on' : '')} /></div>
        <div><b>{tt('tri_' + r.tri)}</b><p>{tt('triD_' + r.tri)}</p></div>
      </div>
      {isChild && r.reasons.some(x => x.includes('amblyopia')) && <div className="instr"><Icon n="heart" /><span>{tt('amblyopiaNote')}</span></div>}
      <div className="rgrid">
        <div>
          <section className="sec"><h2>{isChild ? 'What we found' : tt('howYou')}</h2>
            {isChild ? <ul className="muted" style={{ margin: 0, paddingLeft: 18 }}>{(r.reasons.length ? r.reasons : [tt('tri_green')]).map(x => <li key={x}>{x}</li>)}</ul>
            : r.dom ? <div className="use">{['near', 'mid', 'far'].map(z => (
              <div key={z} className={`c-${zc[z][0]} ${r.dominant === z ? 'dom' : ''}`}>
                {r.dominant === z && <span className="star"><Icon n="star" c="s" /></span>}
                <div className="icw" style={{ height: 64 }}>
                  <svg className="i" viewBox="0 0 24 24" style={{ width: 28 + r.dom[z] * 0.45, height: 28 + r.dom[z] * 0.45, strokeWidth: 1.6 }} dangerouslySetInnerHTML={{ __html: ICO[zc[z][1]] }} />
                </div>
                <div className="pc">{r.dom[z]}%</div><b>{tt('z_' + z)}</b><span>{tt('zx_' + z)}</span>
              </div>
            ))}</div> : <button className="btn o" onClick={() => A.startMode('profile')}><Icon n="mic" c="s" /> {tt('card2')}</button>}
          </section>
          <section className="sec"><h2>{tt('testShort')}</h2>
            {testRows(tests, lang).some(x => x.st !== 'na')
              ? <>
                <div className="tw"><table><tbody>
                  {testRows(tests, lang).filter(x => !isChild || x.st !== 'na').map(x => (isChild && x.k === 'va' && tests.va ? { ...x, st: Math.min(tests.va.R, tests.va.L) >= (p.childAge === '3-5' ? 3 : 4) ? 'good' : 'warn' } : x)).map(x => (
                    <tr key={x.k}>
                      <td>{x.label}</td>
                      <td><b>{x.v || '—'}</b></td>
                      <td><span className={'chip ' + x.st}>{tt(x.st === 'na' ? 'notDone' : x.st === 'good' ? 'good' : 'attention')}</span></td>
                    </tr>
                  ))}
                </tbody></table></div>
                <p className="muted small" style={{ marginTop: 8 }}>{tt('testsNote')}</p>
              </>
              : <p className="muted small">{tt('noTestsYet')}</p>}
            {!isChild && <div style={{ marginTop: 10 }}>
              {Object.keys(p.tests || {}).length > 0
                ? <button className="btn o" onClick={A.retakeTests}><Icon n="eye" c="s" /> {tt('retakeTestsShort')}</button>
                : <button className="btn o" onClick={() => A.go('testsIntro')}><Icon n="eye" c="s" /> {tt('takeTests')}</button>}
            </div>}
          </section>
          <section className="sec"><h2>{tt('lensFor')}</h2>
            <div className="lensc"><span className="blob"><Icon n="glasses" c="l" /></span><div>
              <b>{tx(LENS[r.lens], lang)}</b><p>{tt('lens_' + r.lens)}</p>
              {r.coat.length > 0 && <div className="feat">{r.coat.map(c => <span key={c}>{tx(COAT[c], lang)}</span>)}</div>}
            </div></div>
          </section>
          <section className="sec"><h2>{tt('tipsTitle')}</h2>
            <div className="tipg">{r.tips.map((k, i) => <div key={k} className="tip"><span className={'blob c-' + PAL[(i + 1) % PAL.length]}><Icon n={TIP_IC[k]} /></span><span>{tx(TIPS[k][1], lang)}</span></div>)}</div>
          </section>
        </div>
        <aside><div className="sendc">
          <h2>{tt('reviewTitle')}</h2>
          {!st ? <><p>{tt('sendBody')}</p><button className="btn w big" onClick={A.openSend}><Icon n="send" /> {tt('sendDoc')}</button></>
            : st === 'queued' ? <ol className="tl"><li className="now">{tt('st_queued')}</li></ol>
            : <>
              <ol className="tl">{steps.map(([k, d]) => (
                <li key={k} className={k === nowS ? (st === 'replied' ? 'done' : 'now') : d ? 'done' : ''}>
                  <div>{tt('st_' + k)}{k === 'sent' && p.sentAt ? <span>{fmtTime(p.sentAt)}</span> : null}</div>
                </li>
              ))}</ol>
              {st === 'replied' && <button className="btn w" onClick={() => { A.setP({ unread: false }); A.go('messages'); }}>{tt('viewReply')}</button>}
            </>}
          <p className="disc">{tt('disclaimer')}</p>
        </div></aside>
      </div>
    </div>
  );
}

/* ---------------- messages ---------------- */
export function Messages() {
  const p = useP(), lang = useLang();
  const r = p.reply;
  if (!r) return (
    <div className="wrap n"><h1 className="h2">{tt('messages')}</h1>
      <div className="card center" style={{ padding: 48 }}><Icon n="inbox" c="xl" /><p className="muted" style={{ marginTop: 12 }}>{tt('noMsg')}</p></div></div>
  );
  const c = CMAP[r.centre];
  return (
    <div className="wrap n">
      <h1 className="h2" style={{ marginBottom: 16 }}>{tt('messages')}</h1>
      <article className="msgc">
        <div className="mh">
          <span className="av">AR</span>
          <div style={{ flex: 1 }}><b style={{ fontFamily: 'var(--fd)', fontSize: 20 }}>{tx(DOC.name, lang)}</b><div className="small muted">{tt('received', { t: ago(r.at) })}</div></div>
          <button className="btn g sm" onClick={A.playReply}><Icon n="spk" c="s" /> {tt('playVoice')}</button>
        </div>
        <div className="mb">
          <div className="kv"><span className="blob c-indigo"><Icon n="glasses" /></span><div><div className="k">{tt('recLens')}</div><div className="v">{tx(LENS[r.lens], lang)}</div>
            {r.coat.length > 0 && <div className="feat">{r.coat.map(x => <span key={x} className="c-indigo">{tx(COAT[x], lang)}</span>)}</div>}</div></div>
          <div className="kv"><span className="blob c-teal"><Icon n="fwd" /></span><div><div className="k">{tt('nextStep')}</div><div className="v">{tx(NEXT[r.next], lang)}</div></div></div>
          <div className="kv"><span className="blob c-gold"><Icon n="pin" /></span><div><div className="k">{tt('where')}</div><div className="v">{c.name}{c.km ? ', ' + c.km + ' km' : ''}</div><div className="small muted">{c.detail}</div></div></div>
          {(r.notesTranslated || r.notes) && <div className="kv"><span className="blob c-coral"><Icon n="file" /></span><div><div className="k">{tt('docNote')}</div><div className="v" style={{ fontWeight: 500 }}>“{r.notesTranslated || r.notes}”</div></div></div>}
          <div className="row wr" style={{ marginTop: 14 }}>
            <button className="btn o" onClick={() => toast(tt('dirToast'))}><Icon n="pin" c="s" /> {tt('directions')}</button>
            {r.next === 'hospital' && <button className="btn" onClick={() => toast(tt('calling'))}><Icon n="phone" c="s" /> {tt('callHosp')}</button>}
          </div>
        </div>
      </article>
      <p className="small muted">{tt('smsL', { p: p.info.phone || '—' })}</p>
      <div className="sms">{r.text || replyText(p.info.name || '', r, lang)}</div>
    </div>
  );
}

/* ================= CHILD MODE ================= */
// Game-framed screens for ages 3–10. Measurement rules match the adult tests; only the presentation changes.

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

/* Wrong answer: brief shake on the tapped button, no penalty. */
function useShake() {
  const [sh, setSh] = useState(null);
  const shake = k => { setSh(k); setTimeout(() => setSh(x => (x === k ? null : x)), 420); };
  return [sh, shake];
}

function KidDirPad({ onAns, shaking, cant }) {
  const b = (d, rot, lab) => (
    <button aria-label={lab} className={shaking === d ? 'shake' : ''} onClick={() => onAns(d)}>
      <span style={{ display: 'grid', transform: `rotate(${rot}deg)` }}><Icon n="up" c="l" /></span>
    </button>
  );
  return (
    <>
      <div className="pad">
        <span className="c" />{b('up', 0, 'Up')}<span className="c" />
        {b('left', -90, 'Left')}<span className="c" />{b('right', 90, 'Right')}
        <span className="c" />{b('down', 180, 'Down')}<span className="c" />
      </div>
      {cant && <div className="center" style={{ marginTop: 12 }}><button className="btn sm" onClick={() => onAns('cant')}>I can&apos;t see it</button></div>}
    </>
  );
}

function KidSymPad({ opts, onAns, shaking, cant }) {
  return (
    <>
      <div className="kid-syms">
        {opts.map(k => <button key={k} aria-label={LEA_NAME[k]} className={shaking === k ? 'shake' : ''} onClick={() => onAns(k)}><LeaSym k={k} size={52} /></button>)}
      </div>
      {cant && <div className="center" style={{ marginTop: 12 }}><button className="btn sm" onClick={() => onAns('cant')}>I can&apos;t see it</button></div>}
    </>
  );
}

/* ---- entry overlay (opened from the home card) ---- */
export function ChildModeEntry({ onClose }) {
  useLang();
  const [name, setName] = useState('');
  const [band, setBand] = useState(null);
  return (
    <div className="mbg" onClick={e => e.target === e.currentTarget && onClose?.()}>
      <div className="sheet center" role="dialog" aria-labelledby="kidt">
        <div className="row" style={{ justifyContent: 'space-between' }}>
          <button className="btn sm" aria-label={tt('back')} onClick={onClose}><Icon n="back" c="s" /> {tt('back')}</button>
          <span />
        </div>
        <Mascot s={80} />
        <h2 className="h2" id="kidt" style={{ marginTop: 10 }}>{tt('childMode')}</h2>
        <label className="fld" style={{ textAlign: 'left', marginTop: 12 }}>
          <span>{tt('childNameQ')}</span>
          <input className="kid-name" value={name} maxLength={40} placeholder="What's their name?" onChange={e => setName(e.target.value)} />
        </label>
        <p style={{ marginTop: 16, fontWeight: 700 }}>{tt('childAgeQ')}</p>
        <div className="kid-age">
          <button aria-pressed={band === '3-5'} onClick={() => setBand('3-5')}><span>⭐</span>{tt('childAge35')}</button>
          <button aria-pressed={band === '6-10'} onClick={() => setBand('6-10')}><span>🐟</span>{tt('childAge610')}</button>
        </div>
        <button className="btn p big w" style={{ marginTop: 18 }} disabled={!band} onClick={() => { onClose?.(); A.startChildMode(band, name); }}>
          Let&apos;s go! <Icon n="fwd" />
        </button>
      </div>
    </div>
  );
}

/* ---- parent questions ---- */
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
          ? <button className="btn p" disabled={!val} onClick={A.doneParentQ}>Continue <Icon n="fwd" c="s" /></button>
          : <button className="btn p" disabled={!val} onClick={() => setI(i + 1)}>{tt('next')} <Icon n="fwd" c="s" /></button>}
      </div>
    </div>
  );
}

/* ---- practice round (doesn't count) ---- */
const PRACTICE_SYMS = ['house', 'circle', 'apple'];
export function ChildPractice() {
  const p = useP(); useLang();
  const young = p.childAge === '3-5';
  const [target, setTarget] = useState(() => (young ? pick(PRACTICE_SYMS) : randDir()));
  const [hits, setHits] = useState(0);
  const [sh, shake] = useShake();
  const onAns = a => {
    if (a !== target) return shake(a);
    if (hits + 1 >= 2) return A.passPractice();
    setHits(hits + 1);
    setTarget(young ? pick(PRACTICE_SYMS, target) : randDir(target));
  };
  return (
    <div className="wrap n">
      <div className="talk">
        <Mascot s={70} />
        <div className="bubble">
          <h2>{tt('childPracticeTitle')}</h2>
          <div className="lead">{tt('childPracticeSub')}</div>
        </div>
      </div>
      <div className="kid-stars" aria-label={`${hits} of 2`}>{[0, 1].map(k => <span key={k} className={k < hits ? '' : 'off'}>⭐</span>)}</div>
      {young ? <>
        <div className="tcard" style={{ minHeight: 200 }}><LeaSym k={target} size={120} /></div>
        <p className="center" style={{ fontWeight: 700, marginTop: 10 }}>Tap the same picture!</p>
        <KidSymPad opts={['house', 'circle', 'apple', 'star']} onAns={onAns} shaking={sh} />
      </> : <>
        <div className="tcard" style={{ minHeight: 200 }}>
          <div className="center"><div className="kid-say">{tt('whichWay')}</div><br /><LandoltRing dir={target} size={80} /></div>
        </div>
        <KidDirPad onAns={onAns} shaking={sh} />
      </>}
    </div>
  );
}

/* ---- real tests ---- */
const CHILD_SEQ = ['va', 'amsler'];
const LEA_TEST = ['house', 'circle', 'apple', 'hand'];

function EyePill({ eye }) {
  return <div className="kid-eye" role="status">{tt(eye === 'R' ? 'coverLeft' : 'coverRight')}</div>;
}

function CamCheck() {
  // Placeholder like the adult camera box: a live distance reading will plug in here.
  return (
    <div className="kid-cam">
      <span><Icon n="mobile" c="s" /> Hold the phone about an arm&apos;s length away</span>
      <span className="badge">~40 cm</span>
    </div>
  );
}

function BetweenEyes() {
  return <div className="card center" style={{ padding: 40 }}><span className="kid-star">⭐</span><h2 className="h2" style={{ marginTop: 10 }}>Great job!</h2></div>;
}

const START_LEVEL = 2; // 6/24

function ChildVA({ state, young, onDone }) {
  const nextTarget = ex => (young ? pick(LEA_TEST, ex) : randDir(ex));
  const [eye, setEye] = useState(state.eye ?? 'R');
  const [level, setLevel] = useState(state.level ?? START_LEVEL);
  const [target, setTarget] = useState(() => (young ? pick(LEA_TEST) : state.dir ?? randDir()));
  const [correct, setCorrect] = useState(0);
  const [best, setBest] = useState(state.best ?? -1);
  const [fellBack, setFellBack] = useState(false);
  const [rTmp, setRTmp] = useState(null);
  const [between, setBetween] = useState(false);

  const reset = () => { setLevel(START_LEVEL); setCorrect(0); setBest(-1); setFellBack(false); setTarget(nextTarget()); };

  function finishEye(b) {
    if (eye === 'R') {
      setRTmp(b); setBetween(true);
      setTimeout(() => { setEye('L'); reset(); setBetween(false); }, 1500);
    } else onDone({ R: rTmp, L: b });
  }

  function onAns(a) {
    if (a === target) {
      const n = correct + 1;
      if (n >= 2) {
        if (level >= VA.length - 1) return finishEye(level);
        setBest(level); setLevel(level + 1); setCorrect(0); setTarget(nextTarget());
      } else { setCorrect(n); setTarget(nextTarget(target)); }
      return;
    }
    // Missed the first (6/24) level before passing anything: drop to 6/60 and climb with the adult rule,
    // so a child who can't see 6/24 is measured rather than recorded as "worse than 6/60".
    if (best < 0 && level === START_LEVEL && !fellBack) { setFellBack(true); setLevel(0); setCorrect(0); setTarget(nextTarget()); return; }
    finishEye(best);
  }

  if (between) return <BetweenEyes />;
  return (
    <div>
      <p className="muted small center" style={{ margin: '0 0 6px' }}>Help Drishti find the hiding fish 🐟</p>
      <EyePill eye={eye} />
      <CamCheck />
      <div className="tcard">
        <span className="lv">{VA[level]}</span>
        {young ? <LeaSym k={target} size={VA_PX[level]} /> : <LandoltRing dir={target} size={VA_PX[level]} />}
      </div>
      {young
        ? <><p className="center" style={{ fontWeight: 700, marginTop: 10 }}>Which picture is it?</p><KidSymPad opts={LEA_TEST} onAns={onAns} cant /></>
        : <><p className="center" style={{ fontWeight: 700, marginTop: 10 }}>{tt('whichWay')}</p><KidDirPad onAns={onAns} cant /></>}
    </div>
  );
}

function ChildAmsler({ state, onDone }) {
  const [eye, setEye] = useState(state.eye ?? 'R');
  const [marks, setMarks] = useState([]);
  const [rCount, setRCount] = useState(state.R ?? 0);
  const [between, setBetween] = useState(false);
  const toggle = i => setMarks(m => (m.includes(i) ? m.filter(x => x !== i) : [...m, i]));
  function finishEye(n) {
    if (eye === 'R') {
      setRCount(n); setBetween(true);
      setTimeout(() => { setEye('L'); setMarks([]); setBetween(false); }, 1500);
    } else onDone({ R: rCount, L: n });
  }
  if (between) return <BetweenEyes />;
  return (
    <div>
      <p className="muted small center" style={{ margin: '0 0 6px' }}>Look at the dot in the middle. Can you see it clearly? 👀</p>
      <EyePill eye={eye} />
      <p className="center" style={{ fontWeight: 700 }}>Tap any squares that look wobbly, missing, or funny.</p>
      <div className="tcard">
        <div className="amsler" role="group" aria-label="Amsler grid">
          {Array.from({ length: 196 }, (_, i) => <button key={i} data-v={i} aria-pressed={marks.includes(i)} aria-label={`Square ${i + 1}`} onClick={() => toggle(i)} />)}
        </div>
      </div>
      <div className="row" style={{ marginTop: 14 }}>
        <button className="btn" style={{ flex: 1 }} disabled={marks.length === 0} onClick={() => finishEye(marks.length)}>Done</button>
        <button className="btn p" style={{ flex: 1 }} disabled={marks.length > 0} onClick={() => finishEye(0)}>All looks fine</button>
      </div>
    </div>
  );
}

export function ChildTestRunner() {
  const p = useP(); useLang();
  const cur = p.cur, done = p.childTests || {};
  if (!cur) return null;
  const young = p.childAge === '3-5';
  return (
    <div className="wrap n">
      <div className="kid-stars" aria-label="Progress">{CHILD_SEQ.map(k => <span key={k} className={done[k] ? '' : 'off'}>⭐</span>)}</div>
      {cur === 'va' && <ChildVA key={'va' + p.childAge} state={p.ts || {}} young={young} onDone={r => A.doneChildTest('va', r)} />}
      {cur === 'amsler' && <ChildAmsler key="amsler" state={p.ts || {}} onDone={r => A.doneChildTest('amsler', r)} />}
    </div>
  );
}

/* ---- between-tests reward ---- */
export function ChildReward() {
  const p = useP(); useLang();
  useEffect(() => { A.resumeChild(); }, []);
  const allDone = CHILD_SEQ.every(k => p.childTests?.[k]);
  return (
    <div className="wrap n"><div className="card center" style={{ padding: '56px 24px' }}>
      <span className="kid-star" aria-hidden="true">⭐</span>
      <h2 className="h2" style={{ marginTop: 16 }}>{tt('childStar', { name: p.childName || 'friend' })}</h2>
      <p className="muted small" style={{ marginTop: 8 }}>{allDone ? tt('childDone') : 'Getting ready for the next part…'}</p>
    </div></div>
  );
}
