// Extracted from the v3 prototype (prototype/index.html). Shared by client and server — keep it free of DOM and browser APIs.
import { T, tx } from './i18n.js';

export const SEC_COL={eyes:'indigo',day:'teal',health:'coral'};
export const PAL=['indigo','teal','gold','coral','sky','leaf'];
export const YNS=[{v:'yes',ic:'check',l:T.yes,kw:['haan','ha','ಹೌದು','yes']},{v:'some',ic:'tilde',l:T.some,kw:['kabhi','ಕೆಲವೊಮ್ಮೆ','sometimes']},{v:'no',ic:'x',l:T.no,kw:['nahi','nahin','ಇಲ್ಲ','no']}];
export const NONE=l=>({v:'none',ic:'check',l:l||['None','कोई नहीं','ಯಾವುದೂ ಇಲ್ಲ'],kw:['none','nothing','koi nahi','ಯಾವುದೂ','no']});
export const SCENE=[
 {v:'paper',z:'near',ic:'book',l:['Newspaper','अख़बार','ಪತ್ರಿಕೆ'],kw:['paper','news','akhbaar','ಪತ್ರಿಕೆ']},
 {v:'phone',z:'near',ic:'mobile',l:['Phone','फ़ोन','ಫೋನ್'],kw:['phone','mobile','ಫೋನ್']},
 {v:'needle',z:'near',ic:'needle',l:['Needle','सुई','ಸೂಜಿ'],kw:['needle','sui','ಸೂಜಿ']},
 {v:'cook',z:'mid',ic:'pot',l:['Cooking','खाना बनाना','ಅಡುಗೆ'],kw:['cook','khana','ಅಡುಗೆ','stove']},
 {v:'computer',z:'mid',ic:'monitor',l:['Computer, TV','कंप्यूटर, टीवी','ಕಂಪ್ಯೂಟರ್, ಟಿವಿ'],kw:['computer','tv','ಟಿವಿ']},
 {v:'counter',z:'mid',ic:'store',l:['Shop counter','दुकान काउंटर','ಅಂಗಡಿ ಕೌಂಟರ್'],kw:['counter','shop','dukaan','ಅಂಗಡಿ']},
 {v:'bus',z:'far',ic:'bus',l:['Bus number','बस नंबर','ಬಸ್ ಸಂಖ್ಯೆ'],kw:['bus','ಬಸ್']},
 {v:'face',z:'far',ic:'users',l:['Faces far away','दूर के चेहरे','ದೂರದ ಮುಖಗಳು'],kw:['face','chehra','ಮುಖ']},
 {v:'sign',z:'far',ic:'sign',l:['Signboard','साइनबोर्ड','ಫಲಕ'],kw:['sign','board','ಫಲಕ']},
];
export const SMAP=Object.fromEntries(SCENE.map(s=>[s.v,s]));
export const zonesOf=a=>[...new Set((a.scene||[]).map(v=>SMAP[v]&&SMAP[v].z).filter(Boolean))];
export const RF=[
 {v:'loss',ic:'zap',l:['Vision went dark','अचानक दिखना बंद','ದೃಷ್ಟಿ ಕತ್ತಲಾಯಿತು'],kw:['dark','sudden','andhera','ಕತ್ತಲು','ಹಠಾತ್']},
 {v:'flash',ic:'spark',l:['Flashes or floaters','चमक या तैरते धब्बे','ಮಿಂಚು ಅಥವಾ ತೇಲುವ ಚುಕ್ಕೆ'],kw:['flash','float','chamak','ಮಿಂಚು']},
 {v:'curtain',ic:'cloud',l:['Shadow or curtain','परछाईं या पर्दा','ನೆರಳು ಅಥವಾ ಪರದೆ'],kw:['shadow','curtain','parda','ನೆರಳು','ಪರದೆ']},
 {v:'pain',ic:'alert',l:['Strong eye pain','तेज़ आँख दर्द','ತೀವ್ರ ಕಣ್ಣು ನೋವು'],kw:['pain','dard','ನೋವು']},
];
export const Q=[
 /* ---- your eyes ---- */
 {id:'age',sec:'eyes',type:'age',t:['How old are you?','आपकी उम्र क्या है?','ನಿಮ್ಮ ವಯಸ್ಸು ಎಷ್ಟು?']},
 {id:'cc',sec:'eyes',type:'single',t:['What troubles your eyes the most?','आपकी आँखों में सबसे ज़्यादा क्या परेशानी है?','ನಿಮ್ಮ ಕಣ್ಣುಗಳಿಗೆ ಹೆಚ್ಚು ತೊಂದರೆ ಏನು?'],o:[
  {v:'far',ic:'mountain',l:['Far is blurry','दूर धुंधला','ದೂರ ಮಸುಕು'],kw:['far','door','ದೂರ']},
  {v:'near',ic:'book',l:['Reading is hard','पढ़ने में दिक्कत','ಓದಲು ಕಷ್ಟ'],kw:['read','padh','ಓದ','near','paas']},
  {v:'strain',ic:'head',l:['Tired eyes, headache','थकी आँखें, सिरदर्द','ಕಣ್ಣು ಆಯಾಸ, ತಲೆನೋವು'],kw:['tired','head','sir','thakan','ತಲೆ','ಆಯಾಸ']},
  {v:'irrit',ic:'drop',l:['Red, itchy, watery','लाल, खुजली, पानी','ಕೆಂಪು, ತುರಿಕೆ, ನೀರು'],kw:['red','itch','water','khujli','ತುರಿಕೆ','ಕೆಂಪು']},
  {v:'sudden',ic:'zap',l:['Sudden change or pain','अचानक बदलाव या दर्द','ಹಠಾತ್ ಬದಲಾವಣೆ ಅಥವಾ ನೋವು'],kw:['sudden','pain','achanak','dard','ಹಠಾತ್','ನೋವು']},
  {v:'checkup',ic:'shieldchk',l:['Just a check-up','बस जाँच','ಕೇವಲ ತಪಾಸಣೆ'],kw:['check','jaanch','ತಪಾಸಣೆ','nothing']},
 ]},
 {id:'cc_sudden',sec:'eyes',type:'multi',parent:'cc',cond:a=>a.cc==='sudden',rule:'Sudden change → identify red-flag type immediately',t:['What happened? Tap all.','क्या हुआ? सब चुनें।','ಏನಾಯಿತು? ಎಲ್ಲವನ್ನೂ ಆರಿಸಿ.'],o:RF},
 {id:'cc_irrit',sec:'eyes',type:'single',parent:'cc',cond:a=>a.cc==='irrit',rule:'Red/itchy eye → check for pain (urgent) or discharge (infection)',t:['Is there pain, or sticky discharge?','क्या दर्द है, या चिपचिपा पानी?','ನೋವು ಇದೆಯೇ, ಅಥವಾ ಅಂಟು ಸ್ರಾವ?'],o:[
  {v:'pain',ic:'alert',l:['Pain','दर्द','ನೋವು'],kw:['pain','dard','ನೋವು']},
  {v:'discharge',ic:'drop',l:['Sticky discharge','चिपचिपा पानी','ಅಂಟು ಸ್ರಾವ'],kw:['sticky','discharge','chipchipa','ಅಂಟು']},
  {v:'neither',ic:'check',l:['Neither','दोनों नहीं','ಯಾವುದೂ ಇಲ್ಲ'],kw:['neither','no','nahi','ಇಲ್ಲ']},
 ]},
 {id:'cc_since',sec:'eyes',type:'single',parent:'cc',cond:a=>['far','near','strain'].includes(a.cc),rule:'Blur or strain → ask onset (recent change needs exam)',t:['Since when?','कब से?','ಯಾವಾಗಿನಿಂದ?'],o:[
  {v:'weeks',ic:'calendar',l:['A few weeks','कुछ हफ़्ते','ಕೆಲವು ವಾರ'],kw:['week','hafte','ವಾರ']},
  {v:'months',ic:'calendar',l:['Some months','कुछ महीने','ಕೆಲವು ತಿಂಗಳು'],kw:['month','mahine','ತಿಂಗಳು']},
  {v:'years',ic:'hourglass',l:['Years','सालों से','ವರ್ಷಗಳಿಂದ'],kw:['year','saal','ವರ್ಷ']},
 ]},
 {id:'cc_eye',sec:'eyes',type:'single',parent:'cc',cond:a=>['far','near'].includes(a.cc),rule:'Blur → one eye or both (one-eye blur needs exam)',t:['One eye or both?','एक आँख या दोनों?','ಒಂದು ಕಣ್ಣೇ ಅಥವಾ ಎರಡೂ?'],o:[
  {v:'right',ic:'eye',l:['Right eye','दाईं आँख','ಬಲ ಕಣ್ಣು'],kw:['right','daayin','ಬಲ']},
  {v:'left',ic:'eye',l:['Left eye','बाईं आँख','ಎಡ ಕಣ್ಣು'],kw:['left','baayin','ಎಡ']},
  {v:'both',ic:'eyes2',l:['Both eyes','दोनों आँखें','ಎರಡೂ ಕಣ್ಣು'],kw:['both','dono','ಎರಡೂ']},
 ]},
 {id:'strain_when',sec:'eyes',type:'multi',parent:'cc',cond:a=>a.cc==='strain',rule:'Strain → find the trigger (screen, close work, sun, evening)',t:['When does it happen?','यह कब होता है?','ಇದು ಯಾವಾಗ ಆಗುತ್ತದೆ?'],o:[
  {v:'screen',ic:'mobile',l:['After phone or TV','फ़ोन या टीवी के बाद','ಫೋನ್ ಅಥವಾ ಟಿವಿ ನಂತರ'],kw:['phone','tv','ಫೋನ್']},
  {v:'close',ic:'needle',l:['After reading, sewing','पढ़ने, सिलाई के बाद','ಓದು, ಹೊಲಿಗೆ ನಂತರ'],kw:['read','sew','silai','ಓದು','ಹೊಲಿಗೆ']},
  {v:'sun',ic:'sun',l:['In bright sun','तेज़ धूप में','ಪ್ರಖರ ಬಿಸಿಲಿನಲ್ಲಿ'],kw:['sun','dhoop','ಬಿಸಿಲು']},
  {v:'evening',ic:'moon',l:['By evening','शाम तक','ಸಂಜೆಯ ವೇಳೆಗೆ'],kw:['evening','shaam','ಸಂಜೆ']},
 ]},
 {id:'scene',sec:'eyes',type:'scene',cond:a=>a.cc!=='sudden',t:['Which of these look blurry to you?','इनमें से क्या धुंधला दिखता है?','ಇವುಗಳಲ್ಲಿ ಯಾವುದು ಮಸುಕಾಗಿ ಕಾಣುತ್ತದೆ?']},
 {id:'presby',sec:'eyes',type:'single',parent:'scene',cond:(a,age)=>age>=38&&zonesOf(a).includes('near'),rule:'Age ≥ 38 and near items blurry → presbyopia follow-up',lead:['Close things look blurry.','पास की चीज़ें धुंधली दिखती हैं।','ಹತ್ತಿರದ ವಸ್ತುಗಳು ಮಸುಕಾಗಿ ಕಾಣುತ್ತವೆ.'],t:['Do you hold things farther away to read?','क्या पढ़ने के लिए चीज़ें दूर करके पकड़ते हैं?','ಓದಲು ವಸ್ತುಗಳನ್ನು ದೂರ ಹಿಡಿಯುತ್ತೀರಾ?'],o:YNS},
 {id:'switching',sec:'eyes',type:'single',cond:(a,age)=>age>=35&&zonesOf(a).length>0,rule:'Age ≥ 35 with blur → ask about switching focus (progressive need)',t:['Is it slow to change focus from phone to road?','फ़ोन से सड़क पर नज़र बदलने में देर लगती है?','ಫೋನಿನಿಂದ ರಸ್ತೆಗೆ ದೃಷ್ಟಿ ಬದಲಿಸಲು ತಡವಾಗುತ್ತದೆಯೇ?'],o:YNS},
 {id:'glasses',sec:'eyes',type:'single',t:['Do you wear glasses?','क्या आप चश्मा पहनते हैं?','ನೀವು ಕನ್ನಡಕ ಹಾಕುತ್ತೀರಾ?'],o:[
  {v:'yes',ic:'glasses',l:['Yes','हाँ','ಹೌದು'],kw:['yes','haan','ಹೌದು']},
  {v:'no',ic:'ban',l:['No','नहीं','ಇಲ್ಲ'],kw:['no','nahi','ಇಲ್ಲ']},
  {v:'used',ic:'hourglass',l:['I used to','पहले पहनता था','ಹಿಂದೆ ಹಾಕುತ್ತಿದ್ದೆ'],kw:['used','pehle','ಹಿಂದೆ']},
 ]},
 {id:'glasses_for',sec:'eyes',type:'single',parent:'glasses',cond:a=>a.glasses==='yes'||a.glasses==='used',rule:'Wears glasses → what for',t:['What are they for?','चश्मा किस लिए है?','ಕನ್ನಡಕ ಯಾವುದಕ್ಕೆ?'],o:[
  {v:'far',ic:'mountain',l:['Far','दूर','ದೂರ'],kw:['far','door','ದೂರ']},
  {v:'read',ic:'book',l:['Reading','पढ़ना','ಓದು'],kw:['read','padh','ಓದು']},
  {v:'both',ic:'glasses',l:['Both','दोनों','ಎರಡೂ'],kw:['both','dono','ಎರಡೂ']},
 ]},
 {id:'glasses_src',sec:'eyes',type:'single',parent:'glasses_for',cond:a=>a.glasses==='yes'||a.glasses==='used',rule:'Wears glasses → where from (readymade = no exam)',t:['Where did you get them?','चश्मा कहाँ से लिया?','ಕನ್ನಡಕ ಎಲ್ಲಿಂದ ಪಡೆದಿರಿ?'],o:[
  {v:'exam',ic:'eye',l:['After an eye test','आँख जाँच के बाद','ಕಣ್ಣು ಪರೀಕ್ಷೆಯ ನಂತರ'],kw:['test','doctor','jaanch','ಪರೀಕ್ಷೆ']},
  {v:'market',ic:'tag',l:['Market, readymade','बाज़ार, रेडीमेड','ಮಾರುಕಟ್ಟೆ, ರೆಡಿಮೇಡ್'],kw:['market','readymade','bazaar','ಮಾರುಕಟ್ಟೆ']},
  {v:'other',ic:'users',l:['Someone else’s','किसी और का','ಬೇರೆಯವರದ್ದು'],kw:['someone','other','kisi','ಬೇರೆ']},
 ]},
 {id:'glasses_age',sec:'eyes',type:'single',parent:'glasses_src',cond:a=>a.glasses==='yes'||a.glasses==='used',rule:'Wears glasses → how old',t:['How old are they?','चश्मा कितना पुराना है?','ಕನ್ನಡಕ ಎಷ್ಟು ಹಳೆಯದು?'],o:[
  {v:'lt1',ic:'spark',l:['Under 1 year','1 साल से कम','1 ವರ್ಷದೊಳಗೆ'],kw:['new','less','naya','ಹೊಸ']},
  {v:'1to2',ic:'calendar',l:['1 to 2 years','1 से 2 साल','1 ರಿಂದ 2 ವರ್ಷ'],kw:['one','two','ek','do','ಒಂದು','ಎರಡು']},
  {v:'gt2',ic:'hourglass',l:['Over 2 years','2 साल से ज़्यादा','2 ವರ್ಷಕ್ಕೂ ಹೆಚ್ಚು'],kw:['old','more','purana','ಹಳೆ']},
 ]},
 /* ---- your day ---- */
 {id:'work',sec:'day',type:'single',t:['What work do you do?','आप क्या काम करते हैं?','ನೀವು ಏನು ಕೆಲಸ ಮಾಡುತ್ತೀರಿ?'],o:[
  {v:'farming',ic:'sprout',l:['Farming','खेती','ಕೃಷಿ'],kw:['farm','field','kheti','ಹೊಲ','ಕೃಷಿ','ರೈತ']},
  {v:'labour',ic:'tool',l:['Labour, building','मज़दूरी','ಕೂಲಿ ಕೆಲಸ'],kw:['labour','building','mazdoori','ಕೂಲಿ']},
  {v:'shop',ic:'store',l:['Shop','दुकान','ಅಂಗಡಿ'],kw:['shop','dukaan','ಅಂಗಡಿ']},
  {v:'home',ic:'home',l:['Home work','घर का काम','ಮನೆಕೆಲಸ'],kw:['home','ghar','ಮನೆ']},
  {v:'craft',ic:'needle',l:['Tailoring, crafts','सिलाई, दस्तकारी','ಹೊಲಿಗೆ, ಕರಕುಶಲ'],kw:['tailor','sew','silai','ಹೊಲಿಗೆ']},
  {v:'student',ic:'cap',l:['Student','पढ़ाई','ವಿದ್ಯಾರ್ಥಿ'],kw:['student','school','ಶಾಲೆ']},
  {v:'office',ic:'monitor',l:['Office','ऑफ़िस','ಕಚೇರಿ'],kw:['office','computer','ಕಚೇರಿ']},
  {v:'driver',ic:'truck',l:['Driver','ड्राइवर','ಚಾಲಕ'],kw:['driver','drive','ಚಾಲಕ']},
 ]},
 {id:'dust',sec:'day',type:'single',parent:'work',cond:a=>['farming','labour'].includes(a.work),rule:'Outdoor or manual work → ask about dust and smoke (eye protection)',t:['Is there dust or smoke at work?','काम पर धूल या धुआँ होता है?','ಕೆಲಸದಲ್ಲಿ ಧೂಳು ಅಥವಾ ಹೊಗೆ ಇದೆಯೇ?'],o:YNS},
 {id:'nearwork',sec:'day',type:'hours',parent:'work',cond:a=>['craft','student','shop','office','home'].includes(a.work),rule:'Close-work job → measure hours of near work',t:['How many hours of close work, like reading or sewing?','पढ़ने या सिलाई जैसे पास के काम के कितने घंटे?','ಓದು ಅಥವಾ ಹೊಲಿಗೆಯಂತಹ ಹತ್ತಿರದ ಕೆಲಸ ಎಷ್ಟು ಗಂಟೆ?']},
 {id:'outdoor',sec:'day',type:'hours',t:['How many hours are you out in the sun?','आप कितने घंटे धूप में रहते हैं?','ನೀವು ಎಷ್ಟು ಗಂಟೆ ಬಿಸಿಲಿನಲ್ಲಿ ಇರುತ್ತೀರಿ?']},
 {id:'phone',sec:'day',type:'hours',t:['How many hours on phone or TV?','फ़ोन या टीवी पर कितने घंटे?','ಫೋನ್ ಅಥವಾ ಟಿವಿ ಎಷ್ಟು ಗಂಟೆ?']},
 {id:'drive',sec:'day',type:'single',t:['Do you drive or ride?','क्या आप गाड़ी चलाते हैं?','ನೀವು ವಾಹನ ಓಡಿಸುತ್ತೀರಾ?'],o:[
  {v:'no',ic:'walk',l:['No','नहीं','ಇಲ್ಲ'],kw:['no','nahi','ಇಲ್ಲ']},
  {v:'cycle',ic:'bike',l:['Cycle','साइकिल','ಸೈಕಲ್'],kw:['cycle','ಸೈಕಲ್']},
  {v:'two',ic:'moto',l:['Bike, scooter','बाइक, स्कूटर','ಬೈಕ್, ಸ್ಕೂಟರ್'],kw:['bike','scooter','ಬೈಕ್','ಸ್ಕೂಟರ್']},
  {v:'four',ic:'car',l:['Car, tractor','कार, ट्रैक्टर','ಕಾರು, ಟ್ರ್ಯಾಕ್ಟರ್'],kw:['car','tractor','truck','ಕಾರು','ಟ್ರ್ಯಾಕ್ಟರ್']},
 ]},
 {id:'night',sec:'day',type:'single',parent:'drive',cond:a=>a.drive&&a.drive!=='no',rule:'Drives → ask about night glare',t:['At night, do headlights dazzle you?','रात में सामने की लाइट से आँखें चौंधियाती हैं?','ರಾತ್ರಿ ಎದುರಿನ ದೀಪದಿಂದ ಕಣ್ಣು ಕುಕ್ಕುತ್ತದೆಯೇ?'],o:[
  {v:'glare',ic:'sun',l:['Yes, a lot','हाँ, बहुत','ಹೌದು, ತುಂಬಾ'],kw:['yes','lot','haan','bahut','ಹೌದು']},
  {v:'ok',ic:'check',l:['No problem','कोई दिक्कत नहीं','ತೊಂದರೆ ಇಲ್ಲ'],kw:['no problem','theek','ತೊಂದರೆ ಇಲ್ಲ']},
  {v:'no_night',ic:'moon',l:['I don’t drive at night','रात में नहीं चलाता','ರಾತ್ರಿ ಓಡಿಸುವುದಿಲ್ಲ'],kw:['night','raat','ರಾತ್ರಿ']},
 ]},
 /* ---- your health ---- */
 {id:'medical',sec:'health',type:'multi',excl:'none',t:['Do you have any of these?','क्या इनमें से कोई बीमारी है?','ಇವುಗಳಲ್ಲಿ ಯಾವುದಾದರೂ ಇದೆಯೇ?'],o:[
  {v:'diabetes',ic:'drop',l:['Sugar (diabetes)','शुगर (मधुमेह)','ಶುಗರ್ (ಮಧುಮೇಹ)'],kw:['sugar','diabet','शुगर','ಶುಗರ್','ಮಧುಮೇಹ']},
  {v:'bp',ic:'heart',l:['High BP','हाई बीपी','ಹೈ ಬಿಪಿ'],kw:['bp','pressure','ಬಿಪಿ']},
  {v:'thyroid',ic:'thyroid',l:['Thyroid','थायरॉइड','ಥೈರಾಯ್ಡ್'],kw:['thyroid','ಥೈರಾಯ್ಡ್']},
  {v:'unsure',ic:'help',l:['Don’t know','पता नहीं','ಗೊತ್ತಿಲ್ಲ'],kw:['know','pata','ಗೊತ್ತಿಲ್ಲ']},
  NONE(),
 ]},
 {id:'diab_years',sec:'health',type:'single',parent:'medical',cond:a=>has(a.medical,'diabetes'),rule:'Diabetes → duration (risk rises after 5–10 years)',t:['For how many years?','कितने सालों से?','ಎಷ್ಟು ವರ್ಷಗಳಿಂದ?'],o:[
  {v:'lt5',ic:'calendar',l:['Under 5 years','5 साल से कम','5 ವರ್ಷಕ್ಕಿಂತ ಕಡಿಮೆ'],kw:['less','kam','ಕಡಿಮೆ']},
  {v:'5to10',ic:'calendar',l:['5 to 10 years','5 से 10 साल','5 ರಿಂದ 10 ವರ್ಷ'],kw:['five','ten','paanch','das','ಐದು','ಹತ್ತು']},
  {v:'gt10',ic:'hourglass',l:['Over 10 years','10 साल से ज़्यादा','10 ವರ್ಷಕ್ಕೂ ಹೆಚ್ಚು'],kw:['more','zyada','ಹೆಚ್ಚು']},
 ]},
 {id:'diab_check',sec:'health',type:'single',parent:'diab_years',cond:a=>has(a.medical,'diabetes'),rule:'Diabetes → last retinal check',t:['When was your last eye test?','आख़िरी आँख जाँच कब हुई?','ಕೊನೆಯ ಕಣ್ಣು ಪರೀಕ್ಷೆ ಯಾವಾಗ?'],o:[
  {v:'lt1',ic:'calendar',l:['This year','इस साल','ಈ ವರ್ಷ'],kw:['this year','is saal','ಈ ವರ್ಷ']},
  {v:'gt1',ic:'hourglass',l:['Long ago','बहुत पहले','ತುಂಬಾ ಹಿಂದೆ'],kw:['long','pehle','ಹಿಂದೆ']},
  {v:'never',ic:'ban',l:['Never','कभी नहीं','ಎಂದೂ ಇಲ್ಲ'],kw:['never','kabhi nahi','ಎಂದೂ']},
 ]},
 {id:'diab_spots',sec:'health',type:'single',parent:'diab_check',cond:a=>has(a.medical,'diabetes'),rule:'Diabetes → spots or patches (retinopathy symptom)',t:['Do you see dark spots or patches?','काले धब्बे या धुंधले हिस्से दिखते हैं?','ಕಪ್ಪು ಚುಕ್ಕೆ ಅಥವಾ ಮಸುಕು ಭಾಗ ಕಾಣುತ್ತದೆಯೇ?'],o:YNS},
 {id:'meds',sec:'health',type:'single',t:['Do you take steroid tablets or eye drops daily?','क्या रोज़ स्टेरॉयड गोली या आँख की दवा लेते हैं?','ದಿನವೂ ಸ್ಟೀರಾಯ್ಡ್ ಮಾತ್ರೆ ಅಥವಾ ಕಣ್ಣಿನ ಹನಿ ಬಳಸುತ್ತೀರಾ?'],o:[
  {v:'yes',ic:'pill',l:['Yes','हाँ','ಹೌದು'],kw:['yes','haan','ಹೌದು']},
  {v:'no',ic:'x',l:['No','नहीं','ಇಲ್ಲ'],kw:['no','nahi','ಇಲ್ಲ']},
  {v:'unsure',ic:'help',l:['Don’t know','पता नहीं','ಗೊತ್ತಿಲ್ಲ'],kw:['know','pata','ಗೊತ್ತಿಲ್ಲ']},
 ]},
 {id:'surgery',sec:'health',type:'single',t:['Any eye operation or injury before?','पहले आँख का ऑपरेशन या चोट?','ಹಿಂದೆ ಕಣ್ಣಿನ ಶಸ್ತ್ರಚಿಕಿತ್ಸೆ ಅಥವಾ ಗಾಯ?'],o:[
  {v:'none',ic:'check',l:['No','नहीं','ಇಲ್ಲ'],kw:['no','nahi','ಇಲ್ಲ']},
  {v:'cataract',ic:'eye',l:['Cataract operation','मोतियाबिंद ऑपरेशन','ಪೊರೆ ಶಸ್ತ್ರಚಿಕಿತ್ಸೆ'],kw:['cataract','motiyabind','ಪೊರೆ']},
  {v:'injury',ic:'alert',l:['Injury','चोट','ಗಾಯ'],kw:['injury','chot','ಗಾಯ']},
 ]},
 {id:'family',sec:'health',type:'multi',excl:'none',t:['Anyone in your family with glaucoma or blindness?','परिवार में किसी को काला मोतिया या अंधापन?','ಕುಟುಂಬದಲ್ಲಿ ಯಾರಿಗಾದರೂ ಗ್ಲೂಕೋಮಾ ಅಥವಾ ಅಂಧತ್ವ?'],o:[
  {v:'glaucoma',ic:'eye',l:['Glaucoma','काला मोतिया','ಗ್ಲೂಕೋಮಾ'],kw:['glaucoma','kala motia','ಗ್ಲೂಕೋಮಾ']},
  {v:'blind',ic:'eyeoff',l:['Blindness','अंधापन','ಅಂಧತ್ವ'],kw:['blind','andha','ಅಂಧ','ಕುರುಡ']},
  {v:'unsure',ic:'help',l:['Don’t know','पता नहीं','ಗೊತ್ತಿಲ್ಲ'],kw:['know','pata','ಗೊತ್ತಿಲ್ಲ']},
  NONE(),
 ]},
 {id:'redflag',sec:'health',type:'multi',excl:'none',cond:a=>a.cc!=='sudden',t:['Lately, have you had any of these?','हाल में, इनमें से कुछ हुआ?','ಇತ್ತೀಚೆಗೆ ಇವುಗಳಲ್ಲಿ ಯಾವುದಾದರೂ ಆಯಿತೇ?'],o:[...RF,NONE()]},
 {id:'priority',sec:'health',type:'single',t:['What matters most in new glasses?','नए चश्मे में सबसे ज़रूरी क्या?','ಹೊಸ ಕನ್ನಡಕದಲ್ಲಿ ಮುಖ್ಯವಾದುದು ಏನು?'],o:[
  {v:'price',ic:'wallet',l:['Low cost','कम दाम','ಕಡಿಮೆ ಬೆಲೆ'],kw:['cost','cheap','price','sasta','ಬೆಲೆ']},
  {v:'strong',ic:'shield',l:['Strong','मज़बूत','ಗಟ್ಟಿಮುಟ್ಟು'],kw:['strong','mazboot','ಗಟ್ಟಿ']},
  {v:'sun',ic:'sun',l:['Sun protection','धूप से बचाव','ಬಿಸಿಲು ರಕ್ಷಣೆ'],kw:['sun','dhoop','ಬಿಸಿಲು']},
  {v:'one',ic:'glasses',l:['One pair for all','सबके लिए एक','ಎಲ್ಲಕ್ಕೂ ಒಂದೇ'],kw:['one','ek','ಒಂದೇ']},
 ]},
];
/* Optional free-text note, added in phase 2. Translated to English for the portal; ignored by computeResult. */
Q.push({id:'note',sec:'health',type:'text',t:T.noteQ});
Q.forEach(q=>{if(q.type==='multi'&&!q.excl&&q.o.some(o=>o.v==='none'))q.excl='none'});
export const QMAP=Object.fromEntries(Q.map(q=>[q.id,q]));
export const has=(a,v)=>Array.isArray(a)&&a.includes(v);
export function visibleQs(a,age){a=a||{};age=+age||+a.age||0;return Q.filter(q=>!q.cond||q.cond(a,age))}
export function optLabel(q,v,lang){if(q.type==='scene'){const s=SMAP[v];return s?tx(s.l,lang):v}const o=(q.o||[]).find(o=>o.v===v);return o?tx(o.l,lang):v}
export function ansLabel(q,val,lang){
 if(q.type==='text')return val?String(val):tx(T.nothingMore,lang);
 if(q.type==='hours')return tx(T.hoursN,lang).replace('{n}',val);
 if(q.type==='age')return tx(T.yearsN,lang).replace('{n}',val);
 if(q.type==='scene')return val&&val.length?val.map(v=>optLabel(q,v,lang)).join(', '):tx(T.allClear,lang);
 return Array.isArray(val)?val.map(v=>optLabel(q,v,lang)).join(', '):optLabel(q,val,lang)}

