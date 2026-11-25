// Optometrist portal: Analytics and Referral centres.
// Both read the same live queue the portal already loads (GET /api/profiles, up to 500 reports),
// so they update in real time with no extra API.
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LANGS, LENS, NEXT, CENTRES, TRI_EN, computeResult } from '../shared/index.js';
import { Icon, ago, useTick } from '../lib/ui.jsx';
import './insights.css';

const DAY = 24 * 3600_000;
const triOf = r => r.triage || computeResult(r).tri;
const pct = (n, d) => (d ? Math.round((n / d) * 100) : 0);

function duration(ms) {
  if (!Number.isFinite(ms)) return '—';
  const m = Math.round(ms / 60_000);
  if (m < 60) return m + ' min';
  const h = Math.floor(m / 60);
  if (h < 48) return h + ' h' + (m % 60 ? ' ' + (m % 60) + ' min' : '');
  return Math.round(h / 24) + ' days';
}
const median = a => { if (!a.length) return NaN; const s = [...a].sort((x, y) => x - y), i = s.length >> 1; return s.length % 2 ? s[i] : (s[i - 1] + s[i]) / 2; };
const dayKey = t => { const d = new Date(t); return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`; };

/* Horizontal bar list: label, thin bar, count and share. Identity is always in the text, never colour alone. */
function HBars({ rows, total }) {
  const max = Math.max(1, ...rows.map(r => r.n));
  return (
    <ul className="hb2">
      {rows.map(r => (
        <li key={r.k} title={`${r.label}: ${r.n} (${pct(r.n, total)}%)`}>
          <span className="hb2-l">{r.label}</span>
          <span className="hb2-t"><i className={r.cls || ''} style={{ width: Math.max(r.n ? 2 : 0, (r.n / max) * 100) + '%' }} /></span>
          <span className="hb2-v"><b>{r.n}</b> {pct(r.n, total)}%</span>
        </li>
      ))}
    </ul>
  );
}

/* Reports per day, last 14 days: one series, one hue, hover tooltip, optional table view. */
function DailyChart({ list }) {
  const [hover, setHover] = useState(null);
  const [table, setTable] = useState(false);
  const days = useMemo(() => {
    const start = new Date(); start.setHours(0, 0, 0, 0);
    const out = [];
    for (let i = 13; i >= 0; i--) { const d = new Date(start.getTime() - i * DAY); out.push({ d, k: dayKey(d), n: 0, red: 0 }); }
    const idx = Object.fromEntries(out.map((x, i) => [x.k, i]));
    for (const r of list) { const i = idx[dayKey(r.ts)]; if (i !== undefined) { out[i].n++; if (triOf(r) === 'red') out[i].red++; } }
    return out;
  }, [list]);
  const max = Math.max(1, ...days.map(d => d.n));
  const top = max <= 4 ? max : Math.ceil(max / 5) * 5;
  const label = d => d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  const total = days.reduce((s, d) => s + d.n, 0);

  return (
    <div className="box">
      <div className="ins-h"><h3>Reports received, last 14 days</h3>
        <button className="lnk small" onClick={() => setTable(!table)}>{table ? 'Show chart' : 'Show as table'}</button></div>
      <p className="xs muted" style={{ marginTop: -4, marginBottom: 12 }}>{total} report{total === 1 ? '' : 's'} in this period</p>
      {table ? (
        <div className="tw" style={{ border: 0 }}><table>
          <thead><tr><th>Day</th><th>Reports</th><th>Urgent</th></tr></thead>
          <tbody>{[...days].reverse().map(d => <tr key={d.k}><td>{label(d.d)}</td><td>{d.n}</td><td>{d.red}</td></tr>)}</tbody>
        </table></div>
      ) : (
        <div className="dc" onMouseLeave={() => setHover(null)}>
          <div className="dc-y"><span>{top}</span><span>0</span></div>
          <div className="dc-plot">
            <div className="dc-grid" />
            {days.map((d, i) => (
              <div key={d.k} className="dc-col" onMouseEnter={() => setHover(i)} onFocus={() => setHover(i)} tabIndex={0}
                aria-label={`${label(d.d)}: ${d.n} reports, ${d.red} urgent`}>
                <i className="dc-bar" style={{ height: (d.n / top) * 100 + '%' }} />
                {hover === i && <div className={'dc-tip' + (i > 9 ? ' l' : '')}><b>{label(d.d)}</b><span>{d.n} report{d.n === 1 ? '' : 's'}</span>{d.red ? <span>{d.red} urgent</span> : null}</div>}
                <span className="dc-x">{i % 2 === (days.length - 1) % 2 ? label(d.d) : ''}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------------- Analytics ---------------- */
export function Analytics({ list }) {
  useTick(60000);
  const s = useMemo(() => {
    const L = list || [];
    const waiting = L.filter(r => r.status !== 'replied');
    const replied = L.filter(r => r.reply);
    const tri = k => L.filter(r => triOf(r) === k).length;
    const lens = {};
    for (const r of replied) lens[r.reply.lens] = (lens[r.reply.lens] || 0) + 1;
    const next = {};
    for (const r of replied) next[r.reply.next] = (next[r.reply.next] || 0) + 1;
    return {
      L, waiting, replied,
      urgentWaiting: waiting.filter(r => triOf(r) === 'red'),
      oldestUrgent: waiting.filter(r => triOf(r) === 'red').sort((a, b) => a.ts - b.ts)[0],
      replyMs: median(replied.map(r => r.reply.at - r.ts).filter(x => x >= 0)),
      calls: L.filter(r => r.invite).length,
      tri: ['red', 'amber', 'green'].map(k => ({ k, label: TRI_EN[k], n: tri(k), cls: 'c-' + k })),
      status: [['new', 'New, not opened'], ['review', 'In review'], ['replied', 'Replied']].map(([k, label]) => ({ k, label, n: L.filter(r => r.status === k).length })),
      lang: Object.keys(LANGS).map(k => ({ k, label: LANGS[k].name, n: L.filter(r => r.lang === k).length })),
      lens: Object.entries(lens).sort((a, b) => b[1] - a[1]).map(([k, n]) => ({ k, label: LENS[k]?.[0] || k, n })),
      next: Object.entries(next).sort((a, b) => b[1] - a[1]).map(([k, n]) => ({ k, label: NEXT[k]?.[0] || k, n })),
      tests: L.filter(r => Object.keys(r.tests || {}).length).length,
      assisted: L.filter(r => r.assisted).length,
    };
  }, [list]);

  if (!list) return <p className="muted">Loading…</p>;
  const n = s.L.length;
  return <>
    <h1>Analytics</h1>
    <p className="muted">All reports in the queue ({n}). Updates live.</p>
    <div className="stats">
      <div className="stat"><b>{n}</b><span>Reports received</span></div>
      <div className="stat a"><b>{s.waiting.length}</b><span>Waiting for reply</span></div>
      <div className="stat r"><b>{s.urgentWaiting.length}</b><span>Urgent and waiting{s.oldestUrgent ? ` · oldest ${ago(s.oldestUrgent.ts)}` : ''}</span></div>
      <div className="stat g"><b>{duration(s.replyMs)}</b><span>Median time to reply</span></div>
    </div>
    <DailyChart list={s.L} />
    <div className="ins-g">
      <div className="box"><h3>Priority</h3><HBars rows={s.tri} total={n} /></div>
      <div className="box"><h3>Status</h3><HBars rows={s.status} total={n} /></div>
      <div className="box"><h3>Language</h3><HBars rows={s.lang} total={n} /></div>
      <div className="box"><h3>Reach</h3>
        <ul className="ins-kv">
          <li><span>Took the phone vision tests</span><b>{s.tests} <em>{pct(s.tests, n)}%</em></b></li>
          <li><span>Helped by a health worker or family</span><b>{s.assisted} <em>{pct(s.assisted, n)}%</em></b></li>
          <li><span>Video calls booked</span><b>{s.calls}</b></li>
          <li><span>Replies sent</span><b>{s.replied.length}</b></li>
        </ul>
      </div>
      <div className="box"><h3>Lens recommended</h3>{s.lens.length ? <HBars rows={s.lens} total={s.replied.length} /> : <p className="small muted">No replies yet.</p>}</div>
      <div className="box"><h3>Next step advised</h3>{s.next.length ? <HBars rows={s.next} total={s.replied.length} /> : <p className="small muted">No replies yet.</p>}</div>
    </div>
  </>;
}

/* ---------------- Referral centres ---------------- */
const TYPE = { store: 'Optical store', hospital: 'Hospital', camp: 'Eye camp', video: 'Video consultation' };
const TYPE_IC = { store: 'glasses', hospital: 'building', camp: 'users', video: 'video' };

export function Centres({ list }) {
  useTick(60000);
  const nav = useNavigate();
  const [openId, setOpenId] = useState(null);
  const data = useMemo(() => {
    const now = Date.now();
    return CENTRES.map(c => {
      const refs = (list || []).filter(r => r.reply?.centre === c.id).sort((a, b) => b.reply.at - a.reply.at);
      return { c, refs, week: refs.filter(r => now - r.reply.at < 7 * DAY).length, urgent: refs.filter(r => triOf(r) === 'red').length };
    });
  }, [list]);

  if (!list) return <p className="muted">Loading…</p>;
  const total = data.reduce((s, d) => s + d.refs.length, 0);
  return <>
    <h1>Referral centres</h1>
    <p className="muted">Where patients were sent, counted from the replies you and your colleagues sent. {total} referral{total === 1 ? '' : 's'} in total.</p>
    <div className="rc-list">
      {data.map(({ c, refs, week, urgent }) => {
        const open = openId === c.id, shown = open ? refs : refs.slice(0, 3);
        return (
          <section key={c.id} className="box rc">
            <div className="rc-h">
              <span className="rc-ic"><Icon n={TYPE_IC[c.type] || 'pin'} /></span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <h3 style={{ marginBottom: 2 }}>{c.name}</h3>
                <p className="xs muted">{TYPE[c.type] || c.type}{c.km ? ` · ${c.km} km` : ''} · {c.detail}</p>
              </div>
            </div>
            <div className="rc-n">
              <div><b>{week}</b><span>this week</span></div>
              <div><b>{refs.length}</b><span>in total</span></div>
              <div className={urgent ? 'u' : ''}><b>{urgent}</b><span>urgent</span></div>
            </div>
            {refs.length ? <>
              <div className="tw" style={{ border: 0 }}><table>
                <thead><tr><th>Patient</th><th>Priority</th><th>Next step</th><th>Referred</th></tr></thead>
                <tbody>{shown.map(r => {
                  const t = triOf(r);
                  return (
                    <tr key={r.id} className="rw" tabIndex={0} onClick={() => nav('/optometrist/p/' + r.id)} onKeyDown={e => e.key === 'Enter' && nav('/optometrist/p/' + r.id)}>
                      <td className="nm"><b>{r.name}</b><span>{r.pid || ''}{r.village ? ' · ' + r.village : ''}</span></td>
                      <td><span className={'tri ' + t}>{TRI_EN[t]}</span></td>
                      <td>{NEXT[r.reply.next]?.[0] || '—'}</td>
                      <td>{ago(r.reply.at)}</td>
                    </tr>
                  );
                })}</tbody>
              </table></div>
              {refs.length > 3 && <button className="lnk small" onClick={() => setOpenId(open ? null : c.id)}>{open ? 'Show fewer' : `Show all ${refs.length}`}</button>}
            </> : <p className="small muted">No patients referred here yet.</p>}
          </section>
        );
      })}
    </div>
  </>;
}
