import { useEffect, useRef, useState } from 'react';
import {
  QMAP, SCENE, SEC_COL, PAL, LENS, COAT, NEXT, CMAP, DOC, TIPS, TIP_IC, visibleQs, ansLabel, tx, replyText, testRows,
} from '../shared/index.js';
import { ICO } from '../lib/icons.js';
import { Icon, Mascot, toast, ago, fmtDate, fmtTime } from '../lib/ui.jsx';
import { useStore } from '../lib/store.js';
import * as A from './state.js';
import { TESTS, TEST_IC } from './tests/constants.js';
import { ChildModeEntry } from './child/ChildScreens.jsx';
import { AcuityRings, ContrastTest, ColourPlates, AmslerGrid, AstigmatismDial, NearPoint, PupilDistance, SetupCalibration, NearReading } from './tests/index.js';

const { app, tt } = A;
const useP = () => useStore(app, s => s.p);
const useLang = () => useStore(app, s => s.lang);

/* ---------------- home ---------------- */
export function Home() {
  useLang();
  const [showChildEntry, setShowChildEntry] = useState(false);
  const signedIn = useStore(app, s => s.signedIn), mine = useStore(app, s => s.mine);
  const name = mine?.[0]?.name;
  const how = [['mic', 'teal'], ['list', 'indigo'], ['eye', 'gold'], ['file', 'sky'], ['users', 'coral']];
  return (
    <div className="wrap">
      <div className="hero">
        <div>
          <h1 dangerouslySetInnerHTML={{ __html: tt('heroH2') }} />
          <p>{tt('heroP2')}</p>
          <div className="row wr"><button className="btn p big" onClick={() => A.startMode('full')}>{tt('start')} <Icon n="fwd" /></button></div>
          {signedIn
            ? <div className="back-card"><b>{tt('welcomeBack', { name: name ? ', ' + name : '' })}</b>
                <button className="btn sm p" onClick={A.openMyReports}><Icon n="list" c="s" /> {tt('seeMyReports')}</button></div>
            : <button className="status-lnk" onClick={A.openStatusLogin}>{tt('checkStatus')}</button>}
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
      <p className="foot">{tt('disclaimer')}<br /><a href="/optometrist">{tt('optLogin')}</a></p>
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
        <div><b>{tt('tri_' + r.tri)}</b><p>{isChild && r.tri === 'green' ? 'Vision looks normal for age. An optometrist will review the results.' : tt('triD_' + r.tri)}</p></div>
      </div>
      {isChild && r.reasons.some(x => x.includes('amblyopia')) && <div className="instr"><Icon n="heart" /><span>{tt('amblyopiaNote')}</span></div>}
      <div className="rgrid">
        <div>
          <section className="sec"><h2>{isChild ? 'What we found' : tt('howYou')}</h2>
            {isChild ? <ul className="muted" style={{ margin: 0, paddingLeft: 18 }}>{(r.reasons.length ? r.reasons : ['Both eyes within the normal range for age', 'No concerns from the parent questions']).map(x => <li key={x}>{x}</li>)}</ul>
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
            {testRows(tests, lang, { childAge: isChild ? p.childAge : null }).some(x => x.st !== 'na')
              ? <>
                <div className="tw"><table><tbody>
                  {testRows(tests, lang, { childAge: isChild ? p.childAge : null }).map(x => (
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
            {isChild && <div className="row wr" style={{ marginTop: 10 }}>
              <button className="btn o" onClick={A.retakeChild}><Icon n="eye" c="s" /> Play the eye game again</button>
              <button className="lnk small" onClick={A.editParentAnswers}>Change parent answers</button>
            </div>}
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
              {p.invite && <a className="btn p w" style={{ marginTop: 10 }} href={p.invite.meetLink} target="_blank" rel="noopener noreferrer"><Icon n="video" c="s" /> {tt('joinMeet')}</a>}
            </>}
          <p className="disc">{tt('disclaimer')}</p>
        </div></aside>
      </div>
    </div>
  );
}

/* ---------------- video call (Google Meet) ---------------- */
export function InviteCard({ inv, lang }) {
  const LOC = { en: 'en-IN', hi: 'hi-IN', kn: 'kn-IN' }[lang] || 'en-IN';
  const when = new Date(inv.startsAt).toLocaleString(LOC, { weekday: 'long', day: 'numeric', month: 'long', hour: 'numeric', minute: '2-digit' });
  return (
    <article className="msgc vid">
      <div className="mh">
        <span className="blob c-indigo"><Icon n="video" /></span>
        <div style={{ flex: 1 }}><b style={{ fontFamily: 'var(--fd)', fontSize: 20 }}>{tt('vidTitle')}</b><div className="small muted">{tt('newVid')}</div></div>
      </div>
      <div className="mb">
        <div className="kv"><span className="blob c-teal"><Icon n="clock" /></span><div><div className="k">{tt('vidWhen')}</div><div className="v">{when} · {inv.durationMin} min</div></div></div>
        <div className="row wr" style={{ marginTop: 14 }}>
          <a className="btn p w big" href={inv.meetLink} target="_blank" rel="noopener noreferrer"><Icon n="video" /> {tt('joinMeet')}</a>
        </div>
      </div>
    </article>
  );
}

/* ---------------- messages ---------------- */
export function Messages() {
  const p = useP(), lang = useLang();
  const r = p.reply;
  if (!r) return (
    <div className="wrap n"><h1 className="h2" style={{ marginBottom: 16 }}>{tt('messages')}</h1>
      {p.invite ? <InviteCard inv={p.invite} lang={lang} />
        : <div className="card center" style={{ padding: 48 }}><Icon n="inbox" c="xl" /><p className="muted" style={{ marginTop: 12 }}>{tt('noMsg')}</p></div>}</div>
  );
  const c = CMAP[r.centre];
  return (
    <div className="wrap n">
      <h1 className="h2" style={{ marginBottom: 16 }}>{tt('messages')}</h1>
      {p.invite && <InviteCard inv={p.invite} lang={lang} />}
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
// The children's screens live in ./child/ChildScreens.jsx.
export { ChildModeEntry, ChildParentQ, ChildPractice, ChildTestRunner, ChildReward } from './child/ChildScreens.jsx';
