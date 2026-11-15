import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { LANGS, CMAP } from '../shared/index.js';
import { Icon, Mascot } from '../lib/ui.jsx';
import { useStore } from '../lib/store.js';
import { subscribe } from '../lib/realtime.js';
import { stopSpeak } from '../lib/voice.js';
import * as A from './state.js';
import { Home, Consent, Interview, TestsSoon, Result, Messages } from './screens.jsx';

const { app, tt } = A;

function Header() {
  const lang = useStore(app, s => s.lang), voiceOn = useStore(app, s => s.voiceOn), off = useStore(app, s => s.simOffline);
  const p = useStore(app, s => s.p);
  return (
    <header className="hdr"><div className="hdr-in">
      <button className="logo" onClick={A.goHome}><img src="/logo.png" alt="Eyeze" style={{ height: 38, width: 'auto' }} /></button>
      <div className="hdr-r">
        {off && <span className="offpill"><Icon n="nowifi" c="s" /> {tt('offline')}</span>}
        <div className="lchips" role="group" aria-label={tt('chooseLang')}>
          {Object.entries(LANGS).map(([k, l]) => <button key={k} aria-pressed={lang === k} onClick={() => A.setLang(k)}>{l.label}</button>)}
        </div>
        {p.result && <button className="ib" aria-label={tt('myReport')} title={tt('myReport')} onClick={() => A.go('result')}><Icon n="file" /></button>}
        {p.reply && <button className="ib" aria-label={tt('messages')} onClick={() => { A.setP({ unread: false }); A.go('messages'); }}><Icon n="bell" />{p.unread && <span className="dot" />}</button>}
        <button className="ib" aria-label={'Voice ' + (voiceOn ? 'on' : 'off')} onClick={() => { app.set({ voiceOn: !voiceOn }); if (voiceOn) stopSpeak(); }}><Icon n={voiceOn ? 'spk' : 'mute'} /></button>
      </div>
    </div></header>
  );
}

function UrgentModal() {
  const c = CMAP.dist;
  return (
    <div className="mbg"><div className="sheet red center" role="alertdialog" aria-labelledby="ugt">
      <span style={{ color: 'var(--red)' }}><Icon n="alert" c="xl" /></span>
      <h2 className="h2" id="ugt" style={{ color: 'var(--red)', marginTop: 8 }}>{tt('urgentTitle')}</h2>
      <p>{tt('urgentBody')}</p>
      <div className="kv" style={{ textAlign: 'left', marginTop: 12 }}><span className="blob c-coral"><Icon n="building" /></span><div><div className="k">{tt('nearestHosp')}</div><div className="v">{c.name}, {c.km} km</div></div></div>
      <div style={{ display: 'grid', gap: 10, marginTop: 16 }}>
        <a className="btn d w" href="tel:08162274400"><Icon n="phone" c="s" /> {tt('callHosp')}</a>
        <button className="btn w" onClick={A.urgentClose}>{tt('continueCheck')}</button>
      </div>
    </div></div>
  );
}

function LoginModal() {
  const Lg = useStore(app, s => s.p.login), assisted = useStore(app, s => s.p.assisted);
  const ref = useRef(null);
  useEffect(() => { ref.current?.focus(); }, [Lg?.step]);
  if (!Lg) return null;
  const onKey = e => { if (e.key === 'Enter') { e.preventDefault(); A.loginNext(); } };
  const btns = label => (
    <div className="row" style={{ marginTop: 14 }}>
      <button className="btn" style={{ flex: 1 }} onClick={A.loginCancel}>{tt('cancel')}</button>
      <button className="btn p" style={{ flex: 1 }} disabled={Lg.busy} onClick={A.loginNext}>{label}</button>
    </div>
  );
  let b;
  if (Lg.step === 'phone') b = <>
    <label className="fld"><span>{tt('phone')}</span><div className="phonef"><span>+91</span>
      <input ref={ref} type="tel" inputMode="numeric" maxLength={11} placeholder="98450 12345" value={Lg.phone} autoComplete="tel" onKeyDown={onKey} onChange={e => A.updateLogin({ phone: e.target.value })} /></div></label>
    <label className="check"><input type="checkbox" checked={assisted} onChange={e => A.setP({ assisted: e.target.checked })} /><span>{tt('helpL')}</span></label>
    {btns(tt('sendOtp'))}
  </>;
  else if (Lg.step === 'otp') b = <>
    <p className="center">{tt('enterOtp', { p: '+91 ' + Lg.phone.slice(0, 5) + ' ' + Lg.phone.slice(5) })}</p>
    <div className="otp"><input ref={ref} inputMode="numeric" autoComplete="one-time-code" maxLength={6} style={{ width: 230, letterSpacing: 14 }} value={Lg.otp} aria-label="OTP" onKeyDown={onKey}
      onChange={e => { const v = e.target.value.replace(/\D/g, ''); A.updateLogin({ otp: v }); if (v.length === 6) setTimeout(A.loginNext, 200); }} /></div>
    {Lg.demoCode && <p className="hint">{tt('demoOtp', { c: Lg.demoCode })}</p>}
    {btns(tt('verify'))}
  </>;
  else b = <>
    <p className="ok" style={{ margin: '0 0 14px' }}><Icon n="check" c="s" /> {tt('verified')}</p>
    <label className="fld"><span>{tt('yourName')}</span><input ref={ref} value={Lg.name} autoComplete="name" maxLength={80} onKeyDown={onKey} onChange={e => A.updateLogin({ name: e.target.value })} /></label>
    <label className="fld"><span>{tt('village')}</span><input value={Lg.village} maxLength={80} onKeyDown={onKey} onChange={e => A.updateLogin({ village: e.target.value })} /></label>
    {btns(<><Icon n="send" c="s" /> {tt('sendDoc')}</>)}
  </>;
  return (
    <div className="mbg"><div className="sheet" role="dialog" aria-labelledby="lgt">
      <div className="row" style={{ marginBottom: 10 }}><Mascot s={48} /><h2 className="h2" id="lgt" style={{ margin: 0 }}>{tt('loginTitle')}</h2></div>
      <p className="muted" style={{ marginBottom: 16 }}>{tt('loginSub')}</p>
      {b}
    </div></div>
  );
}

function Dock() {
  const s = useStore(app);
  const tg = (on, onClick, lab, sub) => <button className="tog" aria-pressed={on} onClick={onClick}><span>{lab}<small>{sub}</small></span><i /></button>;
  return (
    <div className={'dock ' + (s.dockOpen ? '' : 'min')} role="region" aria-label="Demo controls">
      <button className="dh" onClick={() => app.set({ dockOpen: !s.dockOpen })}><span className={'lv ' + (s.autopilot ? 'on' : '')} />Demo controls</button>
      {s.dockOpen && <div className="db">
        {tg(s.autopilot, A.toggleAuto, 'Guided demo', 'Plays Ramappa’s journey hands-free')}
        {tg(s.simOffline, A.toggleOffline, 'Simulate no internet', 'Shows offline saving and auto-sync')}
        <Link className="tog" to="/optometrist" target="_blank" style={{ textDecoration: 'none', color: 'inherit' }}><span>Optometrist portal<small>Opens the doctor’s view in a new tab</small></span><Icon n="ext" c="s" /></Link>
        <div className="row" style={{ justifyContent: 'space-between', marginTop: 8 }}><span className="xs muted">Engine log</span><button className="lnk xs" onClick={A.resetDemo}>Reset demo</button></div>
        <ol className="dlog">{s.log.length ? s.log.slice(0, 30).map((l, i) => <li key={i} className={l.kind}><time>{l.t}</time>{l.msg}</li>) : <li>Engine events appear here.</li>}</ol>
      </div>}
    </div>
  );
}

export default function PatientApp() {
  const s = useStore(app);
  const { p } = s;

  // Drishti speaks each new screen / question once.
  const spoken = useRef(null);
  const key = A.speakKey(s);
  useEffect(() => {
    if (!key || !s.voiceOn) return;
    const k = key[0] + s.lang;
    if (spoken.current === k) return;
    spoken.current = k;
    A.say(key[1]);
  }, [key?.[0], s.lang, s.voiceOn]); // eslint-disable-line react-hooks/exhaustive-deps

  // Guided demo: one pending step at a time, cancelled by any state change.
  useEffect(() => {
    const h = A.scheduleAuto(s);
    return () => h && clearTimeout(h);
  }, [s]);

  // Live updates for the sent report.
  useEffect(() => {
    if (!p.profileId) return;
    A.refreshMine();
    return subscribe('patient', A.refreshMine);
  }, [p.profileId]);

  // Send reports saved while offline as soon as we're back.
  useEffect(() => {
    A.retryQueued();
    window.addEventListener('online', A.retryQueued);
    return () => window.removeEventListener('online', A.retryQueued);
  }, []);

  useEffect(() => { document.documentElement.lang = s.lang; }, [s.lang]);
  useEffect(() => () => stopSpeak(), []);

  const Screen = { consent: Consent, interview: Interview, testsIntro: TestsSoon, test: TestsSoon, testsDone: Result, result: Result, messages: Messages }[p.screen] || Home;
  return (
    <>
      <Header />
      <main className="main" id="main"><Screen /></main>
      <Dock />
      {p.modal === 'urgent' && <UrgentModal />}
      {p.modal === 'login' && <LoginModal />}
    </>
  );
}
