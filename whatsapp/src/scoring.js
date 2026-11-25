// Questionnaire-only version of computeResult() from the web prototype.
// (The web app also uses on-screen vision tests; WhatsApp has only answers.)
const { QMAP, H, has } = require('./questions');

const LENS = {
  sv_dist: ['Single vision for distance', 'सिंगल विज़न, दूर के लिए', 'ಸಿಂಗಲ್ ವಿಷನ್, ದೂರಕ್ಕೆ'],
  sv_read: ['Single vision for reading', 'सिंगल विज़न, पढ़ने के लिए', 'ಸಿಂಗಲ್ ವಿಷನ್, ಓದಲು'],
  bifocal: ['Bifocal (far and near)', 'बाइफ़ोकल (दूर और पास)', 'ಬೈಫೋಕಲ್ (ದೂರ ಮತ್ತು ಹತ್ತಿರ)'],
  progressive: ['Progressive (all distances)', 'प्रोग्रेसिव (सभी दूरियों के लिए)', 'ಪ್ರೋಗ್ರೆಸಿವ್ (ಎಲ್ಲ ದೂರಗಳಿಗೆ)'],
  none: ['No glasses needed yet', 'अभी चश्मे की ज़रूरत नहीं', 'ಸದ್ಯಕ್ಕೆ ಕನ್ನಡಕ ಬೇಕಿಲ್ಲ'],
  defer: ['Decide after an in-person exam', 'आमने-सामने जाँच के बाद तय होगा', 'ನೇರ ಪರೀಕ್ಷೆಯ ನಂತರ ನಿರ್ಧರಿಸಲಾಗುವುದು'],
};

const TIPS = {
  diab: ['🩸', ['With diabetes, get your eyes checked every year, even if you see well.', 'मधुमेह है तो हर साल आँखों की जाँच कराएँ, चाहे साफ़ दिखता हो।', 'ಮಧುಮೇಹವಿದ್ದರೆ, ಚೆನ್ನಾಗಿ ಕಂಡರೂ ಪ್ರತಿ ವರ್ಷ ಕಣ್ಣು ಪರೀಕ್ಷಿಸಿಕೊಳ್ಳಿ.']],
  family: ['👪', ['Glaucoma can run in families. Ask for an eye pressure check at your next visit.', 'काला मोतिया परिवार में चल सकता है। अगली बार आँखों के दबाव की जाँच ज़रूर कराएँ।', 'ಗ್ಲೂಕೋಮಾ ಕುಟುಂಬದಲ್ಲಿ ಬರಬಹುದು. ಮುಂದಿನ ಭೇಟಿಯಲ್ಲಿ ಕಣ್ಣಿನ ಒತ್ತಡ ಪರೀಕ್ಷೆ ಕೇಳಿ.']],
  ready: ['🛒', ['Readymade reading glasses can strain your eyes. Wait for the optometrist’s advice before buying new ones.', 'रेडीमेड पढ़ने वाले चश्मे से आँखों पर ज़ोर पड़ सकता है। नया लेने से पहले ऑप्टोमेट्रिस्ट की सलाह लें।', 'ರೆಡಿಮೇಡ್ ಓದುವ ಕನ್ನಡಕಗಳು ಕಣ್ಣಿಗೆ ಒತ್ತಡ ತರಬಹುದು. ಹೊಸದನ್ನು ಖರೀದಿಸುವ ಮೊದಲು ಆಪ್ಟೋಮೆಟ್ರಿಸ್ಟ್ ಸಲಹೆ ಪಡೆಯಿರಿ.']],
  night: ['🌙', ['Until you get advice, avoid driving at night if glare makes it hard to see.', 'सलाह मिलने तक, अगर चौंध से दिखने में दिक्कत हो तो रात में गाड़ी न चलाएँ।', 'ಸಲಹೆ ಸಿಗುವವರೆಗೆ, ಕಣ್ಣು ಕುಕ್ಕುವುದರಿಂದ ಕಾಣಲು ಕಷ್ಟವಾದರೆ ರಾತ್ರಿ ವಾಹನ ಓಡಿಸಬೇಡಿ.']],
  sun: ['🧢', ['Outdoors, wear a wide hat or sunglasses with UV protection.', 'बाहर चौड़ी टोपी या UV सुरक्षा वाला धूप का चश्मा पहनें।', 'ಹೊರಗೆ ಅಗಲವಾದ ಟೋಪಿ ಅಥವಾ UV ರಕ್ಷಣೆಯ ತಂಪು ಕನ್ನಡಕ ಧರಿಸಿ.']],
  light: ['💡', ['Do close work in bright, even light. Sit near a window or under a lamp.', 'पास का काम तेज़, एक-सी रोशनी में करें। खिड़की या बल्ब के पास बैठें।', 'ಹತ್ತಿರದ ಕೆಲಸವನ್ನು ಪ್ರಖರ, ಸಮನಾದ ಬೆಳಕಿನಲ್ಲಿ ಮಾಡಿ. ಕಿಟಕಿ ಅಥವಾ ದೀಪದ ಬಳಿ ಕುಳಿತುಕೊಳ್ಳಿ.']],
  r2020: ['⏱️', ['Every 20 minutes of phone or close work, look at something far away for 20 seconds.', 'हर 20 मिनट फ़ोन या पास के काम के बाद, 20 सेकंड दूर किसी चीज़ को देखें।', 'ಪ್ರತಿ 20 ನಿಮಿಷ ಫೋನ್ ಅಥವಾ ಹತ್ತಿರದ ಕೆಲಸದ ನಂತರ, 20 ಸೆಕೆಂಡು ದೂರದ ವಸ್ತುವನ್ನು ನೋಡಿ.']],
  blink: ['😌', ['Blink often, and rest your eyes when they feel tired or dry.', 'बार-बार पलकें झपकाएँ, और थकान या सूखापन लगे तो आँखों को आराम दें।', 'ಆಗಾಗ ಕಣ್ಣು ಮಿಟುಕಿಸಿ, ಆಯಾಸ ಅಥವಾ ಒಣಗಿದಂತೆ ಅನಿಸಿದಾಗ ಕಣ್ಣಿಗೆ ವಿಶ್ರಾಂತಿ ಕೊಡಿ.']],
  rub: ['🤲', ['Don’t rub your eyes. If dust gets in, wash with clean water.', 'आँखें न मलें। धूल जाए तो साफ़ पानी से धोएँ।', 'ಕಣ್ಣು ಉಜ್ಜಬೇಡಿ. ಧೂಳು ಬಿದ್ದರೆ ಶುದ್ಧ ನೀರಿನಿಂದ ತೊಳೆಯಿರಿ.']],
};

function computeResult({ answers: a, age }) {
  age = +age || 0;
  // 1. Functional vision profile: which distance dominates this person's day?
  const h = k => H[a[k]] || 0;
  let near = h('nearwork') + h('screen') * 0.6, mid = h('screen') * 0.4 + 0.4, far = h('outdoor');
  const occ = { farming: [0, .5, 3], shop: [1, 2.5, .5], office: [1, 3, 0], student: [2.5, 1, .5], home: [1, 2.5, .5], craft: [3, 1, 0], driver: [0, .5, 4] }[a.occupation] || [0, 0, 0];
  near += occ[0]; mid += occ[1]; far += occ[2];
  if (a.drive && a.drive !== 'no') far += a.drive === 'four' ? 2 : 1;
  const tot = near + mid + far || 1;
  const dom = { near: Math.round(near / tot * 100), mid: Math.round(mid / tot * 100) };
  dom.far = 100 - dom.near - dom.mid;
  const dominant = Object.entries(dom).sort((x, y) => y[1] - x[1])[0][0];

  // 2. Triage: green / amber / red
  const reasons = [], flags = [];
  let tri = 'green';
  const amber = s => { if (tri !== 'red') tri = 'amber'; reasons.push(s); };
  const red = s => { tri = 'red'; reasons.unshift(s); };
  const rf = (a.redflag || []).filter(x => x !== 'none');
  if (rf.length) red('Red-flag symptom: ' + rf.map(v => QMAP.redflag.o.find(o => o.v === v).l[0].toLowerCase()).join(', '));
  if (has(a.medical, 'diabetes')) {
    amber('Diabetes' + (a.diab_check === 'never' ? ', never had an eye exam' : a.diab_check === 'gt1' ? ', no eye exam in over a year' : '') + ' — needs a dilated retinal exam');
    if (a.diab_spots === 'yes' || a.diab_spots === 'some') amber('Diabetic with spots or blurry patches');
  }
  if (has(a.family, 'glaucoma') || has(a.family, 'blind')) amber('Family history of glaucoma/blindness — check eye pressure');
  if (has(a.symptoms, 'double')) amber('Double vision reported');
  if (age >= 60) amber('Age 60+ — routine screen for cataract and glaucoma');

  // 3. Lens suggestion (for the optometrist to confirm, never final)
  const nearIssue = has(a.difficulty, 'near') || a.presby === 'yes';
  const farIssue = has(a.difficulty, 'far');
  const midIssue = has(a.difficulty, 'mid') || a.switching === 'yes';
  if (a.presby === 'yes') flags.push('Presbyopia likely');
  if (a.glasses === 'readymade') flags.push('Using readymade readers from the market');
  if (a.glasses_age === 'gt2') flags.push('Current glasses are over 2 years old');
  if (a.night === 'glare') flags.push('Night glare while driving');
  if (has(a.symptoms, 'light')) flags.push('Light sensitivity');
  let lens;
  if (tri === 'red') lens = 'defer';
  else if (age >= 40 && nearIssue && (farIssue || midIssue)) lens = (a.priority === 'one' || dominant === 'mid' || a.occupation === 'office') ? 'progressive' : 'bifocal';
  else if (age >= 40 && nearIssue) lens = 'sv_read';
  else if (farIssue) lens = 'sv_dist';
  else if (nearIssue || midIssue) lens = 'defer';
  else lens = 'none';

  const tips = [];
  if (has(a.medical, 'diabetes')) tips.push('diab');
  if (has(a.family, 'glaucoma')) tips.push('family');
  if (a.glasses === 'readymade') tips.push('ready');
  if (a.night === 'glare') tips.push('night');
  if (['h3', 'h6'].includes(a.outdoor)) tips.push('sun');
  if (nearIssue) tips.push('light');
  if (['h3', 'h6'].includes(a.screen) || ['h3', 'h6'].includes(a.nearwork)) tips.push('r2020');
  if (has(a.symptoms, 'strain') || has(a.symptoms, 'water')) tips.push('blink');
  tips.push('rub');

  return { dom, dominant, tri, reasons, flags, lens, tips: [...new Set(tips)].slice(0, 5) };
}

module.exports = { computeResult, LENS, TIPS };
