import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  LANGS, LENS, COAT, NEXT, CENTRES, CMAP, QMAP, ZN, TRI_EN, computeResult, testRows, visibleQs, ansLabel, optLabel, replyText,
} from '../shared/index.js';
import { api, absUrl, getConfig } from '../lib/api.js';
import { getToken, signInOptometrist, signOut } from '../lib/auth.js';
import { subscribe } from '../lib/realtime.js';
import { playUrl } from '../lib/voice.js';
import { Icon, Mascot, toast, ago, fmtDate, useTick } from '../lib/ui.jsx';

/* ---------------- data hook ---------------- */
function useQueue(signedIn) {
  const [list, setList] = useState(null);
  const load = useCallback(async () => {
    const token = await getToken('optometrist');
    if (!token) return;
    try { setList((await api('/profiles', { token })).profiles); }
    catch (e) { if (e.status !== 0) toast(e.message); }
  }, []);
  useEffect(() => {
    if (!signedIn) return;
    load();
    let t;
    const unsub = subscribe('optometrist', () => { clearTimeout(t); t = setTimeout(load, 250); });
    return () => { clearTimeout(t); unsub(); };
  }, [signedIn, load]);
  return [list, load];
}

/* ---------------- sign in ---------------- */
function SignIn({ onDone }) {
  const [cfg, setCfg] = useState(null);
  const [email, setEmail] = useState(''), [pw, setPw] = useState(''), [busy, setBusy] = useState(false);
  useEffect(() => { getConfig().then(c => { setCfg(c); if (c.mode === 'demo') { setEmail('anjali.rao@eyeze.in'); setPw('demo-password'); } }); }, []);
  const submit = async e => {
    e.preventDefault();
    setBusy(true);
    try { onDone(await signInOptometrist(email.trim(), pw)); }
    catch (err) { toast(err.message || 'Sign in failed'); }
    setBusy(false);
  };
  return (
    <div className="login"><form className="sheet" onSubmit={submit}>
      <div className="row" style={{ marginBottom: 6 }}><Mascot s={44} /><b style={{ fontFamily: 'var(--fd)', fontSize: 22, color: 'var(--teal)' }}>Eyeze</b></div>
      <h2 className="h2">Optometrist sign in</h2>
      <p className="muted" style={{ marginBottom: 18 }}>Review patient profiles and reply remotely.</p>
      <label className="fld"><span>Email</span><input type="email" value={email} onChange={e => setEmail(e.target.value)} autoComplete="username" required /></label>
      <label className="fld"><span>Password</span><input type="password" value={pw} onChange={e => setPw(e.target.value)} autoComplete="current-password" required /></label>
      <button className="btn p w" disabled={busy}><Icon n="lock" c="s" /> Sign in</button>
      <p className="xs muted center" style={{ marginTop: 12 }}>
        {cfg?.mode === 'demo' ? 'Demo mode: credentials pre-filled · ' : ''}<Link to="/">Back to patient app</Link>
      </p>
    </form></div>
  );
}

/* ---------------- queue ---------------- */
function Queue({ list }) {
  const nav = useNavigate();
  const [f, setF] = useState('all'), [q, setQ] = useState('');
  useTick();
  const all = useMemo(() => (list || []).map(r => ({ r, res: computeResult(r) })), [list]);
  const cnt = k => all.filter(({ r, res }) => r.status !== 'replied' && res.tri === k).length;
  const ql = q.trim().toLowerCase();
  const rows = all
    .filter(({ r, res }) => f === 'all' ? true : f === 'replied' ? r.status === 'replied' : (r.status !== 'replied' && res.tri === f))
    .filter(({ r }) => !ql || (r.name + ' ' + r.village + ' ' + (r.pid || '')).toLowerCase().includes(ql));
  const open = id => nav('/optometrist/p/' + id);
  return <>
    <h1>Patient queue</h1>
    <p className="muted">{fmtDate(null, 'en')} · Tumakuru district programme</p>
    <div className="stats">
      <div className="stat r"><b>{cnt('red')}</b><span>Urgent</span></div>
      <div className="stat a"><b>{cnt('amber')}</b><span>Check soon</span></div>
      <div className="stat g"><b>{cnt('green')}</b><span>Routine</span></div>
      <div className="stat"><b>{all.filter(x => x.r.status !== 'replied').length}</b><span>Waiting for reply</span></div>
    </div>
    <div className="fbar">
      <div className="tabs">{[['all', 'All'], ['red', 'Urgent'], ['amber', 'Check soon'], ['green', 'Routine'], ['replied', 'Replied']].map(([k, l]) =>
        <button key={k} aria-pressed={f === k} onClick={() => setF(k)}>{l}</button>)}</div>
      <input className="search" type="search" placeholder="Search name, village or ID" value={q} onChange={e => setQ(e.target.value)} aria-label="Search patients" />
    </div>
    <div className="tw"><table>
      <thead><tr><th>Priority</th><th>Patient</th><th>Village</th><th>Language</th><th>Vision use</th><th>Received</th><th>Status</th></tr></thead>
      <tbody>
        {list === null && <tr><td colSpan="7" className="muted">Loading…</td></tr>}
        {list && !rows.length && <tr><td colSpan="7" className="muted">No patients in this view.</td></tr>}
        {rows.map(({ r, res }) => {
          const isNew = r.live && r.status === 'new';
          return (
            <tr key={r.id} className={'rw ' + (isNew ? 'live' : '')} tabIndex={0} onClick={() => open(r.id)} onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), open(r.id))}>
              <td><span className={'tri ' + res.tri}>{TRI_EN[res.tri]}</span></td>
              <td className="nm"><b>{r.name}{isNew && <span className="newtag">NEW</span>}</b><span>{r.pid || ''} · {r.age}{r.gender === 'female' ? ' F' : r.gender === 'male' ? ' M' : ''}{r.assisted ? ' · assisted' : ''}</span></td>
              <td>{r.village || '—'}</td>
              <td>{LANGS[r.lang]?.name}</td>
              <td>{res.dominant ? ZN[res.dominant] + ' ' + res.dom[res.dominant] + '%' : '—'}</td>
              <td>{ago(r.ts)}</td>
              <td><span className={'st ' + r.status}>{({ new: 'New', review: 'In review', replied: 'Replied' })[r.status]}</span></td>
            </tr>
          );
        })}
      </tbody>
    </table></div>
    <p className="small muted" style={{ marginTop: 12 }}>Sorted by status, priority and waiting time. Updates live as reports arrive. Patients don’t need to be online at the same time as you.</p>
  </>;
}

/* ---------------- detail ---------------- */
function ClipButton({ clip }) {
  const [busy, setBusy] = useState(false);
  const play = async e => {
    e.stopPropagation();
    setBusy(true);
    try { const { url } = await api('/voice/clip?key=' + encodeURIComponent(clip), { token: await getToken('optometrist') }); await playUrl(absUrl(url)); }
    catch { toast('Could not play this recording'); }
    setBusy(false);
  };
  return <button className="btn sm g" style={{ padding: '2px 10px', minHeight: 0 }} onClick={play} disabled={busy} aria-label="Play the patient’s voice answer"><Icon n="spk" c="s" /> Play</button>;
}

function ReplyForm({ r, res, onSent }) {
  const [f, setF] = useState({ lens: res.lens, coat: res.coat, next: res.next, centre: res.centre, notes: '' });
  const [busy, setBusy] = useState(false);
  const set = patch => setF(x => ({ ...x, ...patch }));
  const send = async () => {
    setBusy(true);
    try {
      const out = await api(`/profiles/${r.id}/reply`, { method: 'POST', body: f, token: await getToken('optometrist') });
      (out.warnings || []).forEach(w => toast(w));
      toast('Reply sent to ' + r.name);
      onSent();
    } catch (e) { toast(e.message); }
    setBusy(false);
  };
  return (
    <div className="box"><h3>Recommendation</h3>
      <div className="sugg"><b>Decision support: {LENS[res.lens][0]}</b><ul>{res.why.map(w => <li key={w}>{w}</li>)}</ul><span className="xs muted">Rule-based suggestion to support your clinical judgement.</span></div>
      <label className="fld"><span>Lens type</span><select value={f.lens} onChange={e => set({ lens: e.target.value })}>{Object.keys(LENS).map(k => <option key={k} value={k}>{LENS[k][0]}</option>)}</select></label>
      <fieldset className="fld"><legend>Lens features</legend>{Object.keys(COAT).map(k => (
        <label key={k} className="cbx"><input type="checkbox" checked={f.coat.includes(k)} onChange={e => set({ coat: e.target.checked ? [...f.coat, k] : f.coat.filter(x => x !== k) })} />{COAT[k][0]}</label>
      ))}</fieldset>
      <label className="fld"><span>Next step</span><select value={f.next} onChange={e => set({ next: e.target.value })}>{Object.keys(NEXT).map(k => <option key={k} value={k}>{NEXT[k][0]}</option>)}</select></label>
      <label className="fld"><span>Location</span><select value={f.centre} onChange={e => set({ centre: e.target.value })}>{CENTRES.map(c => <option key={c.id} value={c.id}>{c.name}{c.km ? ` (${c.km} km)` : ''}</option>)}</select></label>
      <label className="fld"><span>Note to patient (optional, in English)</span><textarea value={f.notes} maxLength={1000} placeholder={r.lang === 'en' ? 'Read aloud to the patient' : `Translated into ${LANGS[r.lang].name} and read aloud to the patient`} onChange={e => set({ notes: e.target.value })} /></label>
      <div className="preview"><span className="k">Patient will hear this in {LANGS[r.lang].name}</span>{replyText(r.name, f, r.lang)}{f.notes && <em className="muted">{' '}+ your note{r.lang !== 'en' ? `, translated into ${LANGS[r.lang].name}` : ''}</em>}</div>
      <button className="btn p w" disabled={busy} onClick={send}><Icon n="send" c="s" /> {busy ? 'Translating and recording…' : 'Send voice message and SMS'}</button>
    </div>
  );
}

function Detail({ list, reload }) {
  const { id } = useParams();
  const nav = useNavigate();
  useTick();
  const r = (list || []).find(x => x.id === id);

  useEffect(() => {
    if (!r || r.status !== 'new') return;
    getToken('optometrist').then(token => api(`/profiles/${r.id}/open`, { method: 'POST', token })).then(reload).catch(() => {});
  }, [r?.id, r?.status]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!list) return <p className="muted">Loading…</p>;
  if (!r) return <><button className="lnk" onClick={() => nav('/optometrist')}><Icon n="back" c="s" /> Patient queue</button><p className="muted" style={{ marginTop: 16 }}>This report was not found.</p></>;

  const res = computeResult(r), rows = testRows(r.tests || {}, 'en'), rep = r.reply;
  const vis = visibleQs(r.answers).filter(q => r.answers[q.id] !== undefined);
  const bx = res.tri === 'red' ? 'r' : res.tri === 'amber' ? 'a' : 'g';
  const reopen = async () => {
    try { await api(`/profiles/${r.id}/reply`, { method: 'DELETE', token: await getToken('optometrist') }); reload(); } catch (e) { toast(e.message); }
  };

  return <>
    <button className="lnk" onClick={() => nav('/optometrist')}><Icon n="back" c="s" /> Patient queue</button>
    <div className="rep-h" style={{ marginTop: 12 }}>
      <div><h1 style={{ fontSize: 30 }}>{r.name}</h1>
        <div className="meta">{r.pid || ''} · {r.age} years · {r.village || '—'} · {LANGS[r.lang].name} · {r.phone || ''} · received {ago(r.ts)}{r.assisted ? ' · ' + r.assisted : ''}</div></div>
      <span className={'tri ' + res.tri} style={{ fontSize: 16, padding: '7px 16px' }}>{TRI_EN[res.tri]}</span>
    </div>
    <div className="pgrid">
      <div>
        <div className={'box ' + bx}><h3>Reasons for priority</h3>
          {res.reasons.length ? <ul className="reasons">{res.reasons.map(x => <li key={x}>{x}</li>)}</ul> : <p className="small">No risk factors or red flags reported.</p>}</div>
        <div className="box"><h3>Functional vision profile</h3>
          {res.dom ? <>
            <div className="hb">{['near', 'mid', 'far'].map(z => <div key={z} className={'r ' + (res.dominant === z ? 'dom' : '')}><span>{ZN[z]}</span><div className="tr"><i style={{ width: res.dom[z] + '%' }} /></div><b>{res.dom[z]}%</b></div>)}</div>
            <p className="small" style={{ marginTop: 8 }}><b>{ZN[res.dominant]}-dominant.</b> Work: {optLabel(QMAP.work, r.answers.work, 'en')}. Sun {r.answers.outdoor} h, phone/TV {r.answers.phone} h{r.answers.nearwork !== undefined ? ', close work ' + r.answers.nearwork + ' h' : ''}.</p>
          </> : <p className="muted small">Eye test only, no interview.</p>}
          {res.flags.length > 0 && <ul className="reasons" style={{ marginTop: 10 }}>{res.flags.map(x => <li key={x}>{x}</li>)}</ul>}
        </div>
        {r.answers.note ? <div className="box"><h3>Patient’s note</h3>
          <p>“{r.noteEn || r.answers.note}”</p>
          {r.lang !== 'en' && <p className="xs muted" style={{ marginTop: 6 }}>{r.noteEn ? `Translated from ${LANGS[r.lang].name}. Original: ` : 'Not translated (Sarvam not configured): '}{r.answers.note}</p>}
        </div> : null}
        <div className="box"><h3>Phone screening results</h3>
          {Object.keys(r.tests || {}).length ? <div className="tw" style={{ border: 0 }}><table>
            <thead><tr><th>Test</th><th>Result</th><th>Flag</th><th>Confidence</th></tr></thead>
            <tbody>{rows.map(x => <tr key={x.k}><td>{x.label}</td><td><b>{x.v || '—'}</b></td><td><span className={'chip ' + x.st}>{x.st === 'na' ? 'Not done' : x.st === 'good' ? 'In range' : 'Review'}</span></td>
              <td>{x.st === 'na' ? '—' : <><span className="conf"><i style={{ width: x.conf + '%' }} /></span>{x.conf}%</>}</td></tr>)}</tbody>
          </table></div> : <p className="muted small">No phone tests in this report.</p>}
        </div>
        <div className="box"><h3>Interview transcript <span className="xs muted" style={{ fontWeight: 400, fontFamily: 'var(--fb)' }}>{vis.length} questions in {LANGS[r.lang].name}</span></h3>
          <ul className="qa">{vis.map(q => {
            const v = r.voiceAns?.[q.id];
            return (
              <li key={q.id}>
                <div className="q">{q.t[0]}{q.cond && <span className="fuq">follow-up</span>}</div>
                <div className="a">{v ? <Icon n="mic" c="s" /> : null}{q.id === 'note' && r.noteEn ? r.noteEn : ansLabel(q, r.answers[q.id], 'en')}</div>
                {v?.text && <div className="xs muted" style={{ marginTop: 4, display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                  <span>Heard: “{v.text}”{v.en && v.en !== v.text ? ` (“${v.en}”)` : ''}</span>
                  {v.clip && <ClipButton clip={v.clip} />}
                </div>}
              </li>
            );
          })}</ul>
        </div>
      </div>
      <div><div className="stk">
        {rep ? (
          <div className="box g"><h3>Reply sent {ago(rep.at)}</h3>
            <p className="small"><b>{LENS[rep.lens][0]}</b>{rep.coat.length ? ' · ' + rep.coat.map(c => COAT[c][0]).join(', ') : ''}</p>
            <p className="small">{NEXT[rep.next][0]} — {CMAP[rep.centre].name}</p>
            <div className="preview" style={{ marginTop: 10 }}><span className="k">Voice message and SMS in {LANGS[r.lang].name}{rep.audioKey ? '' : ' (text only)'}</span>{rep.text || replyText(r.name, rep, r.lang)}</div>
            {rep.notes && r.lang !== 'en' && <p className="xs muted">Your note: “{rep.notes}”</p>}
            <div className="row wr"><button className="btn sm" onClick={reopen}>Edit and resend</button></div>
          </div>
        ) : <ReplyForm key={r.id} r={r} res={res} onSent={reload} />}
      </div></div>
    </div>
  </>;
}

/* ---------------- shell ---------------- */
export default function Portal() {
  const [me, setMe] = useState(undefined); // undefined = checking, null = signed out
  const [cfg, setCfg] = useState(null);
  const nav = useNavigate();
  const { id } = useParams();
  const [list, reload] = useQueue(!!me);

  useEffect(() => {
    getConfig().then(setCfg);
    (async () => {
      const token = await getToken('optometrist');
      if (!token) return setMe(null);
      try { const { user } = await api('/auth/me', { token }); setMe(user.role === 'optometrist' ? user : null); }
      catch { setMe(null); }
    })();
  }, []);

  if (me === undefined) return <main className="main" id="main" />;
  if (!me) return <main className="main" id="main"><SignIn onDone={setMe} /></main>;
  const pend = (list || []).filter(r => r.status !== 'replied').length;
  const logout = async () => { await signOut('optometrist'); setMe(null); };
  const reset = async () => { await api('/events/reset', { method: 'POST' }).catch(() => {}); reload(); nav('/optometrist'); };

  return (
    <main className="main" id="main">
      <div className="portal">
        <aside className="pside">
          <div className="brand"><Mascot s={34} /> Eyeze</div>
          <button className="nv" aria-current={true} onClick={() => nav('/optometrist')}><Icon n="list" c="s" /> Patient queue{pend ? <span className="cnt">{pend}</span> : null}</button>
          {cfg?.mode === 'demo' && <button className="nv" onClick={reset}><Icon n="swap" c="s" /> Reset demo data</button>}
          <div className="who">
            <span className="av" style={{ width: 38, height: 38, fontSize: 15 }}>{(me.name || me.email || 'O').split(/\s|@/).filter(w => w && !/^dr\.?$/i.test(w)).slice(0, 2).map(w => w[0].toUpperCase()).join('')}</span>
            <div><b>{me.name || me.email}</b><span>{cfg?.mode === 'demo' ? 'Demo account' : 'Optometrist'}</span></div>
            <button className="lnk" style={{ marginLeft: 'auto', color: '#bcd9d1' }} onClick={logout} aria-label="Sign out"><Icon n="logout" c="s" /></button>
          </div>
        </aside>
        <div className="pmain">{id ? <Detail list={list} reload={reload} /> : <Queue list={list} />}</div>
      </div>
    </main>
  );
}
