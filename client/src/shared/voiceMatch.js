// Extracted from the v3 prototype (prototype/index.html). Shared by client and server — keep it free of DOM and browser APIs.
export function norm(s){return String(s).toLowerCase().replace(/[.,!?;:()“”"'’।]/g,' ').replace(/\s+/g,' ').trim()}
export function matchOpts(alts,opts){const out=[];for(const o of opts){const cands=[...o.l,...(o.kw||[])].map(norm);
 const hit=alts.some(al=>{const A=norm(al);if(!A)return false;const aw=A.split(' ');return cands.some(c=>{if(!c)return false;if(c.length>=2&&(' '+A+' ').includes(' '+c+' '))return true;if(A.length>=3&&c.includes(A))return true;return c.split(' ').some(cw=>cw.length>=4&&aw.some(w=>w.length>=4&&(cw.startsWith(w)||w.startsWith(cw))))})});
 if(hit)out.push(o.v)}return out}
export const NUMW={zero:0,one:1,two:2,three:3,four:4,five:5,six:6,seven:7,eight:8,nine:9,ten:10,eleven:11,twelve:12,ek:1,do:2,teen:3,char:4,chaar:4,paanch:5,chhe:6,saat:7,aath:8,nau:9,das:10,'एक':1,'दो':2,'तीन':3,'चार':4,'पांच':5,'पाँच':5,'छह':6,'सात':7,'आठ':8,'नौ':9,'दस':10,'ಒಂದು':1,'ಎರಡು':2,'ಮೂರು':3,'ನಾಲ್ಕು':4,'ಐದು':5,'ಆರು':6,'ಏಳು':7,'ಎಂಟು':8,'ಒಂಬತ್ತು':9,'ಹತ್ತು':10};
export function parseNum(alts){for(const a of alts){const m=String(a).match(/\d+/);if(m)return+m[0];for(const w of norm(a).split(' '))if(NUMW[w]!==undefined)return NUMW[w]}return null}


/**
 * Map spoken alternatives (native transcript, English translation, …) to an answer for question q.
 * Returns the answer value, or null if nothing matched. `opts` is SCENE for scene questions.
 */
export function matchAnswer(q, alts, sceneOpts) {
  alts = (alts || []).filter(Boolean);
  if (!alts.length) return null;
  if (q.type === 'text') return alts[0].trim() || null;
  if (q.type === 'hours' || q.type === 'age') {
    const n = parseNum(alts);
    if (n === null) return null;
    return q.type === 'age' ? Math.max(5, Math.min(95, n)) : Math.max(0, Math.min(12, n));
  }
  let vals = matchOpts(alts, q.type === 'scene' ? sceneOpts : q.o);
  if (q.type === 'single') return vals[0] ?? null;
  if (q.excl && vals.length > 1) vals = vals.filter(v => v !== q.excl);
  return vals.length ? vals : null;
}
