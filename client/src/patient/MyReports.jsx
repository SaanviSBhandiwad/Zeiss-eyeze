// "My reports": every report this phone number has sent, its status, the optometrist's reply and any video call.
// Shown to returning patients (saved phone session). First-time users never see a login until they send.
import { useEffect, useState } from 'react';
import { LENS, COAT, NEXT, CMAP, tx } from '../shared/index.js';
import { Icon, Mascot } from '../lib/ui.jsx';
import { useStore } from '../lib/store.js';
import { subscribe } from '../lib/realtime.js';
import { absUrl } from '../lib/api.js';
import { playUrl } from '../lib/voice.js';
import * as A from './state.js';
import { InviteCard } from './screens.jsx';
import './myreports.css';

const { app, tt } = A;
const LOC = { en: 'en-IN', hi: 'hi-IN', kn: 'kn-IN' };
const STATUS = { new: 'st_sent', review: 'st_review', replied: 'st_replied' };

function ReplyBody({ rep, lang }) {
  const c = CMAP[rep.centre];
  return (
    <div className="mr-reply">
      <div className="kv"><span className="blob c-indigo"><Icon n="glasses" /></span><div><div className="k">{tt('recLens')}</div><div className="v">{tx(LENS[rep.lens], lang)}</div>
        {rep.coat?.length > 0 && <div className="feat">{rep.coat.map(x => <span key={x} className="c-indigo">{tx(COAT[x], lang)}</span>)}</div>}</div></div>
      <div className="kv"><span className="blob c-teal"><Icon n="fwd" /></span><div><div className="k">{tt('nextStep')}</div><div className="v">{tx(NEXT[rep.next], lang)}</div></div></div>
      {c && <div className="kv"><span className="blob c-gold"><Icon n="pin" /></span><div><div className="k">{tt('where')}</div><div className="v">{c.name}{c.km ? ', ' + c.km + ' km' : ''}</div><div className="small muted">{c.detail}</div></div></div>}
      {(rep.notesTranslated || rep.notes) && <div className="kv"><span className="blob c-coral"><Icon n="file" /></span><div><div className="k">{tt('docNote')}</div><div className="v" style={{ fontWeight: 500 }}>“{rep.notesTranslated || rep.notes}”</div></div></div>}
      {rep.audioUrl && <button className="btn g sm" onClick={() => playUrl(absUrl(rep.audioUrl))}><Icon n="spk" c="s" /> {tt('playVoice')}</button>}
    </div>
  );
}

function ReportCard({ r, lang, openFirst }) {
  const [open, setOpen] = useState(openFirst);
  const when = new Date(r.ts).toLocaleDateString(LOC[lang], { day: 'numeric', month: 'long', year: 'numeric' });
  const time = new Date(r.ts).toLocaleTimeString(LOC[lang], { hour: 'numeric', minute: '2-digit' });
  return (
    <article className="mr-card">
      <div className="mr-h">
        <div style={{ flex: 1, minWidth: 0 }}>
          <b className="mr-t">{tt('reportOn', { d: when })}</b>
          <div className="small muted">{time}{r.pid ? ' · ' + r.pid : ''}</div>
        </div>
        {r.triage && <span className={'tri ' + r.triage}>{tt('tri_' + r.triage)}</span>}
      </div>
      <div className={'mr-st ' + r.status}><Icon n={r.status === 'replied' ? 'check' : 'clock'} c="s" /> {tt(STATUS[r.status] || 'st_sent')}</div>
      {r.invite && <InviteCard inv={r.invite} lang={lang} />}
      {r.reply
        ? <>
          <button className="lnk mr-tg" aria-expanded={open} onClick={() => setOpen(!open)}>{open ? tt('hideReply') : tt('showReply')}</button>
          {open && <ReplyBody rep={r.reply} lang={lang} />}
        </>
        : <p className="small muted" style={{ marginTop: 6 }}>{tt('waitingReply')}</p>}
    </article>
  );
}

export function MyReports() {
  const lang = useStore(app, s => s.lang);
  const signedIn = useStore(app, s => s.signedIn), mine = useStore(app, s => s.mine), err = useStore(app, s => s.mineErr);

  // Live: status changes, replies and booked calls appear without refreshing.
  useEffect(() => {
    if (!signedIn) return;
    A.loadMine();
    return subscribe('patient', A.loadMine);
  }, [signedIn]);

  if (!signedIn) return (
    <div className="wrap n"><div className="card center" style={{ padding: '40px 24px' }}>
      <Mascot s={80} />
      <h1 className="h2" style={{ marginTop: 12 }}>{tt('myReports')}</h1>
      <p className="muted" style={{ margin: '8px 0 18px' }}>{tt('statusSub')}</p>
      <button className="btn p big" onClick={A.openStatusLogin}><Icon n="phone" /> {tt('statusTitle')}</button>
    </div></div>
  );

  return (
    <div className="wrap n">
      <div className="mr-top">
        <div><h1 className="h2">{tt('myReports')}</h1><p className="muted small">{tt('myReportsSub')}</p></div>
        <button className="btn sm" onClick={A.patientSignOut}><Icon n="logout" c="s" /> {tt('signOutP')}</button>
      </div>
      {mine === null && !err && <p className="muted">{tt('loading')}</p>}
      {err && <p className="muted">{tt('loadFail')}</p>}
      {mine && !mine.length && <div className="card center" style={{ padding: 36 }}><Icon n="inbox" c="xl" /><p className="muted" style={{ marginTop: 10 }}>{tt('noReports')}</p></div>}
      {mine?.map(r => <ReportCard key={r.id} r={r} lang={lang} openFirst={r.id === mine.find(x => x.reply)?.id} />)}
      <div style={{ marginTop: 18 }}><button className="btn p w big" onClick={() => A.startMode('full')}><Icon n="eye" /> {tt('newCheck')}</button></div>
    </div>
  );
}
