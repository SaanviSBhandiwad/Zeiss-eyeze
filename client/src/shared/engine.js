// Extracted from the v3 prototype (prototype/index.html). Shared by client and server — keep it free of DOM and browser APIs.
import { T, LI, tx } from './i18n.js';
import { RF, zonesOf, has, optLabel } from './questions.js';

export const TESTS=['setup','va','near','np','contrast','color','amsler','astig','pd'];
export const VA=['6/60','6/36','6/24','6/18','6/12','6/9','6/6'];
export const VA_PX=[104,72,52,40,30,22,15];
export const NEAR=['N24','N18','N14','N12','N10','N8','N6'];
export const NEAR_PX=[30,24,19,16,13.5,11,9];
export const CONTRAST=[100,50,25,12,6,3];
export const PLATES=[{n:12,o:[12,17,21]},{n:74,o:[21,74,71]},{n:6,o:[5,8,6]}];
export const DIRS={right:0,down:90,left:180,up:270};
export const vaStr=i=>i<0?'worse than 6/60':VA[i];
export const TIP_IC={diab:'drop',family:'users',ready:'tag',night:'moon',sun:'sun',light:'bulb',r2020:'clock',blink:'eye',rub:'hand',dust:'shield'};
export const TEST_IC={setup:'card',va:'mountain',near:'book',np:'ruler',contrast:'tilde',color:'eye',amsler:'list',astig:'spark',pd:'eyes2'};
export const LENS={
 sv_dist:['Single vision for distance','सिंगल विज़न, दूर के लिए','ಸಿಂಗಲ್ ವಿಷನ್, ದೂರಕ್ಕೆ'],
 sv_read:['Single vision for reading','सिंगल विज़न, पढ़ने के लिए','ಸಿಂಗಲ್ ವಿಷನ್, ಓದಲು'],
 bifocal:['Bifocal (far and near)','बाइफ़ोकल (दूर और पास)','ಬೈಫೋಕಲ್ (ದೂರ ಮತ್ತು ಹತ್ತಿರ)'],
 progressive:['Progressive (all distances)','प्रोग्रेसिव (सभी दूरियों के लिए)','ಪ್ರೋಗ್ರೆಸಿವ್ (ಎಲ್ಲ ದೂರಗಳಿಗೆ)'],
 none:['No glasses needed yet','अभी चश्मे की ज़रूरत नहीं','ಸದ್ಯಕ್ಕೆ ಕನ್ನಡಕ ಬೇಕಿಲ್ಲ'],
 defer:['Decide after an in-person exam','आमने-सामने जाँच के बाद तय होगा','ನೇರ ಪರೀಕ್ಷೆಯ ನಂತರ ನಿರ್ಧರಿಸಲಾಗುವುದು'],
};
export const COAT={
 uv:['UV and sun protection','UV और धूप से सुरक्षा','UV ಮತ್ತು ಬಿಸಿಲು ರಕ್ಷಣೆ'],
 ar:['Anti-glare for night driving','रात में ड्राइविंग के लिए एंटी-ग्लेयर','ರಾತ್ರಿ ಚಾಲನೆಗೆ ಆಂಟಿ-ಗ್ಲೇರ್'],
 blue:['Blue-light filter for screens','स्क्रीन के लिए ब्लू-लाइट फ़िल्टर','ಪರದೆಗಾಗಿ ಬ್ಲೂ-ಲೈಟ್ ಫಿಲ್ಟರ್'],
 tough:['Scratch-resistant, durable','खरोंच-रोधी, मज़बूत','ಗೀರು ನಿರೋಧಕ, ಗಟ್ಟಿಮುಟ್ಟು'],
};
export const NEXT={
 store:['Visit the partner optical store for final power and fitting','अंतिम नंबर और फ़िटिंग के लिए पार्टनर चश्मे की दुकान पर जाएँ','ಅಂತಿಮ ಸಂಖ್ಯೆ ಮತ್ತು ಹೊಂದಿಕೆಗಾಗಿ ಪಾಲುದಾರ ಕನ್ನಡಕ ಅಂಗಡಿಗೆ ಭೇಟಿ ನೀಡಿ'],
 camp:['Come to the eye camp for a full eye check','पूरी आँख जाँच के लिए आँख शिविर में आएँ','ಪೂರ್ಣ ಕಣ್ಣಿನ ತಪಾಸಣೆಗಾಗಿ ಕಣ್ಣಿನ ಶಿಬಿರಕ್ಕೆ ಬನ್ನಿ'],
 hospital:['Go to the eye hospital urgently','तुरंत आँखों के अस्पताल जाएँ','ತುರ್ತಾಗಿ ಕಣ್ಣಿನ ಆಸ್ಪತ್ರೆಗೆ ಹೋಗಿ'],
 video:['Join a video call with the optometrist','ऑप्टोमेट्रिस्ट के साथ वीडियो कॉल करें','ಆಪ್ಟೋಮೆಟ್ರಿಸ್ಟ್ ಜೊತೆ ವೀಡಿಯೊ ಕರೆಯಲ್ಲಿ ಸೇರಿ'],
};
export const CENTRES=[
 {id:'netra',type:'store',name:'Netra Opticals, Tumakuru',km:14,detail:'Partner optical store, open 9 am to 8 pm, all days',load:'12 referrals this week'},
 {id:'gubbi',type:'store',name:'Vision Centre, Gubbi PHC',km:9,detail:'Government vision centre, Monday to Saturday',load:'7 referrals this week'},
 {id:'camp',type:'camp',name:'Eye camp, Hosahalli Panchayat Hall',km:1,detail:'Saturday 7 November, 9 am to 4 pm',load:'38 of 80 slots booked'},
 {id:'dist',type:'hospital',name:'District Eye Hospital, Tumakuru',km:15,detail:'Emergency eye care, open 24 hours, 0816 227 4400',load:'2 urgent referrals this week'},
 {id:'video',type:'video',name:'Video call with Dr. Anjali Rao',km:0,detail:'Thursday 29 October, 4:30 pm',load:'4 slots left'},
];
export const CMAP=Object.fromEntries(CENTRES.map(c=>[c.id,c]));
export const DOC={name:['Dr. Anjali Rao','डॉ. अंजलि राव','ಡಾ. ಅಂಜಲಿ ರಾವ್']};
export const REPLY_TPL=[
 'Hello {name}. {doc} has reviewed your vision profile. Recommended lens: {lens}. {extras}Next step: {next}, at {centre}.',
 'नमस्ते {name}। {doc} ने आपकी विज़न प्रोफ़ाइल देख ली है। सुझाया गया लेंस: {lens}। {extras}अगला कदम: {next}, {centre} पर।',
 'ನಮಸ್ಕಾರ {name}. {doc} ಅವರು ನಿಮ್ಮ ದೃಷ್ಟಿ ಪ್ರೊಫೈಲ್ ಪರಿಶೀಲಿಸಿದ್ದಾರೆ. ಶಿಫಾರಸು ಮಾಡಿದ ಲೆನ್ಸ್: {lens}. {extras}ಮುಂದಿನ ಹಂತ: {next}, {centre} ನಲ್ಲಿ.'];
export const EXTRAS_TPL=['With: {list}. ','साथ में: {list}। ','ಜೊತೆಗೆ: {list}. '];
export function replyText(name,rep,lang){
 const i=LI[lang]||0;
 const extras=rep.coat&&rep.coat.length?EXTRAS_TPL[i].replace('{list}',rep.coat.map(c=>COAT[c][i]).join(', ')):'';
 const c=CMAP[rep.centre];
 return REPLY_TPL[i].replace('{name}',name).replace('{doc}',DOC.name[i]).replace('{lens}',LENS[rep.lens][i]).replace('{extras}',extras).replace('{next}',NEXT[rep.next][i]).replace('{centre}',c?c.name:'');
}

export const TIPS={
 diab:['🩸',['With diabetes, get your eyes checked every year, even if you see well.','मधुमेह है तो हर साल आँखों की जाँच कराएँ, चाहे साफ़ दिखता हो।','ಮಧುಮೇಹವಿದ್ದರೆ, ಚೆನ್ನಾಗಿ ಕಂಡರೂ ಪ್ರತಿ ವರ್ಷ ಕಣ್ಣು ಪರೀಕ್ಷಿಸಿಕೊಳ್ಳಿ.']],
 family:['👪',['Glaucoma can run in families. Ask for an eye pressure check at your next visit.','काला मोतिया परिवार में चल सकता है। अगली बार आँखों के दबाव की जाँच ज़रूर कराएँ।','ಗ್ಲೂಕೋಮಾ ಕುಟುಂಬದಲ್ಲಿ ಬರಬಹುದು. ಮುಂದಿನ ಭೇಟಿಯಲ್ಲಿ ಕಣ್ಣಿನ ಒತ್ತಡ ಪರೀಕ್ಷೆ ಕೇಳಿ.']],
 ready:['🛒',['Readymade reading glasses can strain your eyes. Wait for the optometrist’s advice before buying new ones.','रेडीमेड पढ़ने वाले चश्मे से आँखों पर ज़ोर पड़ सकता है। नया लेने से पहले ऑप्टोमेट्रिस्ट की सलाह लें।','ರೆಡಿಮೇಡ್ ಓದುವ ಕನ್ನಡಕಗಳು ಕಣ್ಣಿಗೆ ಒತ್ತಡ ತರಬಹುದು. ಹೊಸದನ್ನು ಖರೀದಿಸುವ ಮೊದಲು ಆಪ್ಟೋಮೆಟ್ರಿಸ್ಟ್ ಸಲಹೆ ಪಡೆಯಿರಿ.']],
 night:['🌙',['Until you get advice, avoid driving at night if glare makes it hard to see.','सलाह मिलने तक, अगर चौंध से दिखने में दिक्कत हो तो रात में गाड़ी न चलाएँ।','ಸಲಹೆ ಸಿಗುವವರೆಗೆ, ಕಣ್ಣು ಕುಕ್ಕುವುದರಿಂದ ಕಾಣಲು ಕಷ್ಟವಾದರೆ ರಾತ್ರಿ ವಾಹನ ಓಡಿಸಬೇಡಿ.']],
 sun:['🧢',['Outdoors, wear a wide hat or sunglasses with UV protection.','बाहर चौड़ी टोपी या UV सुरक्षा वाला धूप का चश्मा पहनें।','ಹೊರಗೆ ಅಗಲವಾದ ಟೋಪಿ ಅಥವಾ UV ರಕ್ಷಣೆಯ ತಂಪು ಕನ್ನಡಕ ಧರಿಸಿ.']],
 light:['💡',['Do close work in bright, even light. Sit near a window or under a lamp.','पास का काम तेज़, एक-सी रोशनी में करें। खिड़की या बल्ब के पास बैठें।','ಹತ್ತಿರದ ಕೆಲಸವನ್ನು ಪ್ರಖರ, ಸಮನಾದ ಬೆಳಕಿನಲ್ಲಿ ಮಾಡಿ. ಕಿಟಕಿ ಅಥವಾ ದೀಪದ ಬಳಿ ಕುಳಿತುಕೊಳ್ಳಿ.']],
 r2020:['⏱️',['Every 20 minutes of phone or close work, look at something far away for 20 seconds.','हर 20 मिनट फ़ोन या पास के काम के बाद, 20 सेकंड दूर किसी चीज़ को देखें।','ಪ್ರತಿ 20 ನಿಮಿಷ ಫೋನ್ ಅಥವಾ ಹತ್ತಿರದ ಕೆಲಸದ ನಂತರ, 20 ಸೆಕೆಂಡು ದೂರದ ವಸ್ತುವನ್ನು ನೋಡಿ.']],
 blink:['😌',['Blink often, and rest your eyes when they feel tired or dry.','बार-बार पलकें झपकाएँ, और थकान या सूखापन लगे तो आँखों को आराम दें।','ಆಗಾಗ ಕಣ್ಣು ಮಿಟುಕಿಸಿ, ಆಯಾಸ ಅಥವಾ ಒಣಗಿದಂತೆ ಅನಿಸಿದಾಗ ಕಣ್ಣಿಗೆ ವಿಶ್ರಾಂತಿ ಕೊಡಿ.']],
 rub:['🤲',['Don’t rub your eyes. If dust gets in, wash with clean water.','आँखें न मलें। धूल जाए तो साफ़ पानी से धोएँ।','ಕಣ್ಣು ಉಜ್ಜಬೇಡಿ. ಧೂಳು ಬಿದ್ದರೆ ಶುದ್ಧ ನೀರಿನಿಂದ ತೊಳೆಯಿರಿ.']],
};


TIPS.dust=['',['Wear protective glasses when there is dust, smoke or flying chips at work.','काम पर धूल, धुआँ या उड़ते टुकड़े हों तो सुरक्षा चश्मा पहनें।','ಕೆಲಸದಲ್ಲಿ ಧೂಳು, ಹೊಗೆ ಅಥವಾ ಹಾರುವ ಚೂರುಗಳಿದ್ದರೆ ರಕ್ಷಣಾ ಕನ್ನಡಕ ಧರಿಸಿ.']];

/* Agreed shape of p.tests (see Person 2/3 agreement). A skipped or failed test is stored as {} — never null or 0. */
const TEST_FIELDS={setup:['pxmm'],va:['R','L'],near:['level'],np:['cm','add'],contrast:['pct'],color:['c','n'],amsler:['R','L'],astig:[],pd:['mm']};
const isNum=v=>typeof v==='number'&&Number.isFinite(v);
/** Returns only the tests that hold a usable measurement, so {} (skipped/failed) reads as "not done".
 *  Also accepts the older prototype/seed shape pd:{pd,conf} and exposes it as pd:{mm,conf}. Never mutates the input. */
export function cleanTests(raw){
 const out={};
 if(!raw||typeof raw!=='object')return out;
 for(const k of Object.keys(raw)){
  let v=raw[k];
  if(!v||typeof v!=='object'||Array.isArray(v))continue;
  if(k==='pd'&&!isNum(v.mm)&&isNum(v.pd))v={...v,mm:v.pd};
  const need=TEST_FIELDS[k];
  if(need){
   if(!need.every(f=>isNum(v[f])))continue;
   if(k==='astig'&&!(v.res==='none'||(v.res==='possible'&&isNum(v.axis))))continue;
  }else if(!Object.keys(v).length)continue;
  out[k]=v;
 }
 return out;
}

/** Near-point blur distance (cm) to estimated reading add (dioptres). Ported unchanged from the prototype's npBlur():
 *  accommodation amplitude = 100 / cm, add = 2.5 - amplitude / 2, rounded to 0.25 D and limited to 0 to 3 D. */
export function nearAddFromCm(cm){
 if(!(cm>0))return null;
 const amp=100/cm;
 return Math.max(0,Math.min(3,Math.round((2.5-amp/2)*4)/4));
}

export function computeResult(r){
 const a=r.answers||{},te=cleanTests(r.tests),age=+a.age||+r.age||0;
 const hasProfile=a.work!==undefined;
 const z=zonesOf(a);
 let dom=null,dominant=null;
 if(hasProfile){
  const nearEst={craft:4,student:4,office:2,shop:2,home:2}[a.work]||0.5;
  const nw=a.nearwork!==undefined?+a.nearwork:nearEst,ph=+a.phone||0,od=+a.outdoor||0;
  let near=nw+ph*0.7,mid=ph*0.3+0.4,far=od;
  const occ={farming:[0,0.5,2.5],labour:[0,0.5,2],shop:[0.5,2.5,0.5],office:[0.5,3,0],student:[1.5,1,0.5],home:[0.5,2.5,0.5],craft:[2,1,0],driver:[0,0.5,4]}[a.work]||[0,0,0];
  near+=occ[0];mid+=occ[1];far+=occ[2];
  if(a.drive&&a.drive!=='no')far+=a.drive==='four'?2:1;
  const tot=near+mid+far||1;
  dom={near:Math.round(near/tot*100),mid:Math.round(mid/tot*100)};dom.far=100-dom.near-dom.mid;
  dominant=Object.entries(dom).sort((x,y)=>y[1]-x[1])[0][0];
 }
 const reasons=[],flags=[];let tri='green';
 const amber=s=>{if(tri!=='red')tri='amber';reasons.push(s)};
 const red=s=>{tri='red';reasons.unshift(s)};
 const rfLbl=v=>optLabel({o:RF},v,'en').toLowerCase();
 const rf=[...(a.cc_sudden||[]),...(a.redflag||[])].filter(x=>x!=='none');
 if(rf.length)red('Red-flag symptom: '+[...new Set(rf)].map(rfLbl).join(', '));
 if(a.cc_irrit==='pain')red('Red eye with pain — rule out acute glaucoma, uveitis or keratitis');
 if(te.va&&te.va.R<0&&te.va.L<0)red('Very low vision in both eyes (worse than 6/60)');
 if(a.cc_irrit==='discharge')amber('Red eye with discharge — likely infection, see within 2 days');
 if(a.cc_since==='weeks'&&['far','near'].includes(a.cc))amber('Vision changed within the last few weeks');
 if(a.cc_eye==='right'||a.cc_eye==='left')amber('Blur in one eye only ('+a.cc_eye+')');
 if(has(a.medical,'diabetes')){
  amber('Diabetes'+(a.diab_years==='gt10'?' for over 10 years':a.diab_years==='5to10'?' for 5–10 years':'')+(a.diab_check==='never'?', never had an eye exam':a.diab_check==='gt1'?', no eye exam in over a year':'')+' — needs dilated retinal exam');
  if(a.diab_spots==='yes'||a.diab_spots==='some')amber('Diabetic with spots or patches ('+(a.diab_spots==='yes'?'often':'sometimes')+')');
 }
 if(has(a.family,'glaucoma')||has(a.family,'blind'))amber('Family history of '+(a.family||[]).filter(x=>x==='glaucoma'||x==='blind').map(x=>x==='blind'?'blindness':'glaucoma').join(' and ')+' — check eye pressure');
 if(a.meds==='yes')amber('Regular steroid use — risk of cataract and raised eye pressure');
 if(a.surgery==='injury')amber('Previous eye injury');
 if(age>=60)amber('Age 60+ — screen for cataract and glaucoma');
 if(te.amsler&&(te.amsler.R>0||te.amsler.L>0))amber('Amsler grid distortion marked (R '+te.amsler.R+', L '+te.amsler.L+')');
 if(te.color&&te.color.c<te.color.n)amber('Colour plates: '+te.color.c+' of '+te.color.n+' correct');
 if(te.contrast&&te.contrast.pct>=25)amber('Reduced contrast sensitivity ('+te.contrast.pct+'%), possible early cataract');
 if(te.va&&(te.va.R<3||te.va.L<3)&&!(te.va.R<0&&te.va.L<0))amber('Distance acuity worse than 6/18 in at least one eye');
 const nearIssue=z.includes('near')||a.cc==='near'||a.presby==='yes'||(te.np&&te.np.add>=0.75)||(te.near&&te.near.level!==undefined&&te.near.level<5);
 const farIssue=z.includes('far')||a.cc==='far'||(te.va&&(te.va.R<5||te.va.L<5));
 const midIssue=z.includes('mid')||a.switching==='yes';
 if(a.presby==='yes'||(age>=40&&te.np&&te.np.add>=0.75))flags.push('Presbyopia likely'+(te.np?' (blur at '+te.np.cm+' cm, add ≈ +'+te.np.add.toFixed(2)+')':''));
 if(a.glasses_src==='market')flags.push('Using readymade glasses from the market');
 if(a.glasses_src==='other')flags.push('Using someone else’s glasses');
 if(a.glasses_age==='gt2')flags.push('Current glasses over 2 years old');
 if(a.night==='glare')flags.push('Night glare while driving');
 if(a.dust==='yes')flags.push('Dust or smoke exposure at work');
 if(a.surgery==='cataract')flags.push('Previous cataract surgery');
 if(te.astig&&te.astig.res==='possible')flags.push('Possible astigmatism, axis ≈ '+te.astig.axis+'°');
 let lens,why=[];
 if(tri==='red'){lens='defer';why.push('Red flag — refer before refraction')}
 else if(age>=40&&nearIssue&&(farIssue||midIssue)){
  const pr=a.priority==='one'||dominant==='mid'||a.work==='office';
  lens=pr?'progressive':'bifocal';
  why.push('Age '+age+' with near difficulty'+(te.np?' (add ≈ +'+te.np.add.toFixed(2)+')':''));
  why.push(farIssue?'Distance also affected'+(te.va?' (R '+vaStr(te.va.R)+', L '+vaStr(te.va.L)+')':''):'Intermediate difficulty or slow focus switching');
  why.push(pr?'Wants one pair / intermediate-heavy work → progressive':'Cost priority or outdoor distance-dominant work → bifocal');
 }
 else if(age>=40&&nearIssue){lens='sv_read';why.push('Near difficulty only, distance acceptable')}
 else if(farIssue){lens='sv_dist';why.push('Distance difficulty'+(te.va?' (R '+vaStr(te.va.R)+', L '+vaStr(te.va.L)+')':''))}
 else if(nearIssue||midIssue||a.cc==='strain'){lens='defer';why.push('Near or strain complaints — check for hyperopia or binocular issues in person')}
 else{lens='none';why.push('No reported difficulty and screening within normal limits')}
 const coat=[];
 if(+a.outdoor>=3||a.priority==='sun'||has(a.strain_when,'sun'))coat.push('uv');
 if(a.night==='glare')coat.push('ar');
 if(+a.phone>=4)coat.push('blue');
 if(a.priority==='strong'||a.dust==='yes'||['farming','driver','craft','labour'].includes(a.work))coat.push('tough');
 const next=tri==='red'?'hospital':tri==='amber'?'camp':(lens==='defer'?'video':'store');
 const centre=next==='hospital'?'dist':next==='camp'?'camp':next==='video'?'video':'netra';
 const tips=[];
 if(has(a.medical,'diabetes'))tips.push('diab');
 if(has(a.family,'glaucoma'))tips.push('family');
 if(a.glasses_src==='market'||a.glasses_src==='other')tips.push('ready');
 if(a.dust==='yes')tips.push('dust');
 if(a.night==='glare')tips.push('night');
 if(+a.outdoor>=3)tips.push('sun');
 if(nearIssue)tips.push('light');
 if(+a.phone>=3||+a.nearwork>=3)tips.push('r2020');
 if(a.cc==='strain'||a.cc==='irrit')tips.push('blink');
 tips.push('rub');
 return{dom,dominant,tri,reasons,flags,lens,why,coat,next,centre,tips:[...new Set(tips)].slice(0,6)};
}

/* The agreed pd shape {mm} carries no per-measurement confidence, so the portal shows a fixed value like the other tests. */
const PD_CONF=72;
export function testRows(rawTests,lang){
 const te=cleanTests(rawTests);
 const L=lang||'en',rows=[];
 const add=(k,v,ok,conf)=>rows.push({k,label:tx(T['t_'+k],L),v,st:ok===null?'na':ok?'good':'warn',conf});
 add('va',te.va?'R '+(te.va.R<0?'<6/60':VA[te.va.R])+'  ·  L '+(te.va.L<0?'<6/60':VA[te.va.L]):'',te.va?(te.va.R>=5&&te.va.L>=5):null,82);
 add('near',te.near?(te.near.level<0?'> N24':NEAR[te.near.level]):'',te.near?te.near.level>=5:null,85);
 add('np',te.np?'+'+te.np.add.toFixed(2)+' D ('+te.np.cm+' cm)':'',te.np?te.np.add<0.75:null,70);
 add('contrast',te.contrast?te.contrast.pct+'%':'',te.contrast?te.contrast.pct<=6:null,74);
 add('color',te.color?te.color.c+' / '+te.color.n:'',te.color?te.color.c===te.color.n:null,68);
 add('amsler',te.amsler?(te.amsler.R+te.amsler.L===0?(L==='en'?'No distortion':'—'):'R '+te.amsler.R+'  ·  L '+te.amsler.L):'',te.amsler?te.amsler.R+te.amsler.L===0:null,77);
 add('astig',te.astig?(te.astig.res==='none'?(L==='en'?'Not indicated':'—'):'Axis ≈ '+te.astig.axis+'°'):'',te.astig?te.astig.res==='none':null,60);
 add('pd',te.pd?te.pd.mm.toFixed(1)+' mm':'',te.pd?true:null,te.pd?(isNum(te.pd.conf)?te.pd.conf:PD_CONF):0);
 return rows;
}
export const ZN={near:'Near',mid:'Intermediate',far:'Distance'};
export const TRI_EN={green:'Routine',amber:'Check soon',red:'Urgent'};
export const TRI_RANK = { red: 0, amber: 1, green: 2 }, ST_RANK = { new: 0, review: 1, replied: 2 };

