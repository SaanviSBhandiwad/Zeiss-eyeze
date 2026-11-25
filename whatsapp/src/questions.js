// Question bank, ported 1:1 from DrishtiSetu index.html (const Q).
// l / t arrays are [English, Hindi, Kannada]. `cond` is the adaptive rule.
// `kw` are keywords so typed answers like "kheti" or "ಕೃಷಿ" also match.
const T = { yes:['Yes','हाँ','ಹೌದು'], no:['No','नहीं','ಇಲ್ಲ'], some:['Sometimes','कभी-कभी','ಕೆಲವೊಮ್ಮೆ'] };
const H={h0:0.5,h1:2,h3:4.5,h6:7};
const HOURS=[
 {v:'h0',l:['Less than 1 hour','1 घंटे से कम','1 ಗಂಟೆಗಿಂತ ಕಡಿಮೆ'],kw:['less','kam','ಕಡಿಮೆ','zero']},
 {v:'h1',l:['1 to 3 hours','1 से 3 घंटे','1 ರಿಂದ 3 ಗಂಟೆ'],kw:['one','two','ek','do','ಒಂದು','ಎರಡು']},
 {v:'h3',l:['3 to 6 hours','3 से 6 घंटे','3 ರಿಂದ 6 ಗಂಟೆ'],kw:['three','four','five','teen','char','paanch','ಮೂರು','ನಾಲ್ಕು','ಐದು']},
 {v:'h6',l:['More than 6 hours','6 घंटे से ज़्यादा','6 ಗಂಟೆಗಿಂತ ಹೆಚ್ಚು'],kw:['more','whole day','zyada','poora din','ಹೆಚ್ಚು','ದಿನವಿಡೀ','six','eight']},
];
const YNS=[
 {v:'yes',l:T.yes,kw:['haan','ha','ಹೌದು','yes']},
 {v:'some',l:T.some,kw:['kabhi','ಕೆಲವೊಮ್ಮೆ','sometimes']},
 {v:'no',l:T.no,kw:['nahi','nahin','ಇಲ್ಲ','no']},
];
const NONE=()=>({v:'none',l:['None of these','इनमें से कोई नहीं','ಇವುಗಳಲ್ಲಿ ಯಾವುದೂ ಇಲ್ಲ'],kw:['none','nothing','koi nahi','ಯಾವುದೂ ಇಲ್ಲ','no']});
const has=(a,v)=>Array.isArray(a)&&a.includes(v);
const Q=[
 {id:'occupation',type:'single',t:['What work do you do on most days?','आप ज़्यादातर दिनों में क्या काम करते हैं?','ನೀವು ಹೆಚ್ಚಿನ ದಿನಗಳಲ್ಲಿ ಯಾವ ಕೆಲಸ ಮಾಡುತ್ತೀರಿ?'],o:[
  {v:'farming',l:['Farming or outdoor work','खेती या बाहर का काम','ಕೃಷಿ ಅಥವಾ ಹೊರಾಂಗಣ ಕೆಲಸ'],kw:['farm','field','kheti','khet','ಹೊಲ','ರೈತ','ವ್ಯವಸಾಯ']},
  {v:'shop',l:['Shop or business','दुकान या व्यापार','ಅಂಗಡಿ ಅಥವಾ ವ್ಯಾಪಾರ'],kw:['shop','dukaan','ಅಂಗಡಿ']},
  {v:'office',l:['Office or computer work','ऑफ़िस या कंप्यूटर का काम','ಕಚೇರಿ ಅಥವಾ ಕಂಪ್ಯೂಟರ್ ಕೆಲಸ'],kw:['office','computer','ಕಚೇರಿ']},
  {v:'student',l:['Student','छात्र','ವಿದ್ಯಾರ್ಥಿ'],kw:['study','school','college','padhai','ಶಾಲೆ']},
  {v:'home',l:['Homemaker','गृहिणी या घर का काम','ಗೃಹಿಣಿ ಅಥವಾ ಮನೆಕೆಲಸ'],kw:['home','house','ghar','ಮನೆ']},
  {v:'craft',l:['Tailoring or crafts','सिलाई या दस्तकारी','ಹೊಲಿಗೆ ಅಥವಾ ಕರಕುಶಲ'],kw:['tailor','sew','silai','ಹೊಲಿಗೆ','weav']},
  {v:'driver',l:['Driver','ड्राइवर','ಚಾಲಕ'],kw:['drive','driver','gaadi','ಚಾಲಕ','ಡ್ರೈವರ್']},
 ]},
 {id:'glasses',type:'single',t:['Do you wear glasses or contact lenses now?','क्या आप अभी चश्मा या कॉन्टैक्ट लेंस पहनते हैं?','ನೀವು ಈಗ ಕನ್ನಡಕ ಅಥವಾ ಕಾಂಟ್ಯಾಕ್ಟ್ ಲೆನ್ಸ್ ಧರಿಸುತ್ತೀರಾ?'],o:[
  {v:'none',l:['No','नहीं','ಇಲ್ಲ'],kw:['no','nahi','ಇಲ್ಲ']},
  {v:'distance',l:['Yes, for seeing far','हाँ, दूर देखने के लिए','ಹೌದು, ದೂರ ನೋಡಲು'],kw:['far','door','ದೂರ']},
  {v:'reading',l:['Yes, for reading','हाँ, पढ़ने के लिए','ಹೌದು, ಓದಲು'],kw:['read','padh','ಓದ']},
  {v:'both',l:['Yes, for both','हाँ, दोनों के लिए','ಹೌದು, ಎರಡಕ್ಕೂ'],kw:['both','dono','ಎರಡ']},
  {v:'readymade',l:['Readymade glasses from the market','बाज़ार से रेडीमेड चश्मा','ಮಾರುಕಟ್ಟೆಯ ರೆಡಿಮೇಡ್ ಕನ್ನಡಕ'],kw:['market','readymade','bazaar','ಮಾರುಕಟ್ಟೆ','ರೆಡಿಮೇಡ್']},
 ]},
 {id:'glasses_age',type:'single',cond:a=>a.glasses&&a.glasses!=='none',rule:'Wears glasses → ask how old they are',t:['How old are your current glasses?','आपका चश्मा कितना पुराना है?','ನಿಮ್ಮ ಕನ್ನಡಕ ಎಷ್ಟು ಹಳೆಯದು?'],o:[
  {v:'lt1',l:['Less than 1 year','1 साल से कम','1 ವರ್ಷಕ್ಕಿಂತ ಕಡಿಮೆ'],kw:['less','new','naya','ಹೊಸ']},
  {v:'1to2',l:['1 to 2 years','1 से 2 साल','1 ರಿಂದ 2 ವರ್ಷ'],kw:['one','two','ek','do','ಒಂದು','ಎರಡು']},
  {v:'gt2',l:['More than 2 years','2 साल से ज़्यादा','2 ವರ್ಷಕ್ಕಿಂತ ಹೆಚ್ಚು'],kw:['more','old','purana','ಹಳೆ','ಹೆಚ್ಚು']},
 ]},
 {id:'screen',type:'single',t:['How many hours a day do you look at a phone, TV or computer?','आप दिन में कितने घंटे फ़ोन, टीवी या कंप्यूटर देखते हैं?','ನೀವು ದಿನಕ್ಕೆ ಎಷ್ಟು ಗಂಟೆ ಫೋನ್, ಟಿವಿ ಅಥವಾ ಕಂಪ್ಯೂಟರ್ ನೋಡುತ್ತೀರಿ?'],o:HOURS},
 {id:'nearwork',type:'single',t:['How many hours a day do you do close work, like reading, sewing or sorting grain?','आप दिन में कितने घंटे पास का काम करते हैं, जैसे पढ़ना, सिलाई या अनाज छाँटना?','ಓದುವುದು, ಹೊಲಿಗೆ ಅಥವಾ ಧಾನ್ಯ ಆರಿಸುವಂತಹ ಹತ್ತಿರದ ಕೆಲಸವನ್ನು ದಿನಕ್ಕೆ ಎಷ್ಟು ಗಂಟೆ ಮಾಡುತ್ತೀರಿ?'],o:HOURS},
 {id:'outdoor',type:'single',t:['How many hours a day are you outdoors in daylight?','आप दिन में कितने घंटे बाहर धूप में रहते हैं?','ನೀವು ದಿನಕ್ಕೆ ಎಷ್ಟು ಗಂಟೆ ಹೊರಗೆ ಬಿಸಿಲಿನಲ್ಲಿ ಇರುತ್ತೀರಿ?'],o:HOURS},
 {id:'drive',type:'single',t:['Do you drive or ride a vehicle?','क्या आप कोई वाहन चलाते हैं?','ನೀವು ವಾಹನ ಓಡಿಸುತ್ತೀರಾ?'],o:[
  {v:'no',l:['No','नहीं','ಇಲ್ಲ'],kw:['no','nahi','ಇಲ್ಲ','walk']},
  {v:'cycle',l:['Bicycle','साइकिल','ಸೈಕಲ್'],kw:['cycle','ಸೈಕಲ್']},
  {v:'two',l:['Two-wheeler','दोपहिया','ದ್ವಿಚಕ್ರ ವಾಹನ'],kw:['bike','scooter','motor','two','ಬೈಕ್','ಸ್ಕೂಟರ್']},
  {v:'four',l:['Car, tractor or truck','कार, ट्रैक्टर या ट्रक','ಕಾರು, ಟ್ರ್ಯಾಕ್ಟರ್ ಅಥವಾ ಲಾರಿ'],kw:['car','tractor','truck','lorry','ಕಾರು','ಟ್ರ್ಯಾಕ್ಟರ್','ಲಾರಿ']},
 ]},
 {id:'night',type:'single',cond:a=>a.drive&&a.drive!=='no',rule:'Drives → ask about night driving and glare',t:['Do you drive after dark? Do headlights cause glare or halos?','क्या आप अँधेरे में वाहन चलाते हैं? क्या सामने की रोशनी से चौंध लगती है?','ನೀವು ಕತ್ತಲಲ್ಲಿ ವಾಹನ ಓಡಿಸುತ್ತೀರಾ? ಎದುರಿನ ಬೆಳಕಿನಿಂದ ಕಣ್ಣು ಕುಕ್ಕುತ್ತದೆಯೇ?'],o:[
  {v:'no_night',l:['I don’t drive at night','मैं रात में नहीं चलाता','ನಾನು ರಾತ್ರಿ ಓಡಿಸುವುದಿಲ್ಲ'],kw:['no','nahi','ಇಲ್ಲ']},
  {v:'ok',l:['Yes, without problems','हाँ, बिना दिक्कत','ಹೌದು, ತೊಂದರೆ ಇಲ್ಲದೆ'],kw:['fine','problem','dikkat nahi','ತೊಂದರೆ ಇಲ್ಲ']},
  {v:'glare',l:['Yes, glare bothers me','हाँ, चौंध से परेशानी होती है','ಹೌದು, ಕಣ್ಣು ಕುಕ್ಕುವುದು ತೊಂದರೆ ಕೊಡುತ್ತದೆ'],kw:['glare','chaundh','ಕುಕ್ಕ','light']},
 ]},
 {id:'difficulty',type:'multi',excl:'none',t:['At which distances is it hard for you to see clearly?','किस दूरी पर आपको साफ़ देखने में दिक्कत होती है?','ಯಾವ ದೂರದಲ್ಲಿ ನಿಮಗೆ ಸ್ಪಷ್ಟವಾಗಿ ನೋಡಲು ಕಷ್ಟವಾಗುತ್ತದೆ?'],o:[
  {v:'far',l:['Far: bus numbers, faces across the road','दूर: बस नंबर, सड़क पार चेहरे','ದೂರ: ಬಸ್ ಸಂಖ್ಯೆ, ರಸ್ತೆಯಾಚೆಯ ಮುಖಗಳು'],kw:['far','door','ದೂರ','bus']},
  {v:'mid',l:['Middle: cooking, computer, shop counter','बीच की दूरी: खाना बनाना, कंप्यूटर, काउंटर','ಮಧ್ಯ: ಅಡುಗೆ, ಕಂಪ್ಯೂಟರ್, ಕೌಂಟರ್'],kw:['middle','cook','computer','beech','ಮಧ್ಯ','ಅಡುಗೆ']},
  {v:'near',l:['Near: reading, phone, threading a needle','पास: पढ़ना, फ़ोन, सुई में धागा','ಹತ್ತಿರ: ಓದು, ಫೋನ್, ಸೂಜಿಗೆ ದಾರ'],kw:['near','read','paas','ಹತ್ತಿರ','ಓದ','needle']},
  {v:'none',l:['I see clearly at all distances','मुझे सभी दूरियों पर साफ़ दिखता है','ನನಗೆ ಎಲ್ಲಾ ದೂರದಲ್ಲೂ ಸ್ಪಷ್ಟವಾಗಿ ಕಾಣುತ್ತದೆ'],kw:['no','none','nahi','ಇಲ್ಲ','clear']},
 ]},
 {id:'presby',type:'single',cond:(a,age)=>age>=38&&has(a.difficulty,'near'),rule:'Age ≥ 38 and near difficulty → presbyopia follow-up',t:['Do you hold things farther away to read them clearly?','क्या साफ़ पढ़ने के लिए आप चीज़ों को दूर पकड़ते हैं?','ಸ್ಪಷ್ಟವಾಗಿ ಓದಲು ನೀವು ವಸ್ತುಗಳನ್ನು ದೂರ ಹಿಡಿಯುತ್ತೀರಾ?'],o:YNS},
 {id:'switching',type:'single',cond:(a,age)=>age>=35,rule:'Age ≥ 35 → ask about switching focus between distances',t:['Is it slow or hard to switch focus between near and far, for example from your phone to the road?','क्या पास से दूर नज़र बदलने में देर या दिक्कत होती है, जैसे फ़ोन से सड़क की ओर देखना?','ಹತ್ತಿರದಿಂದ ದೂರಕ್ಕೆ ದೃಷ್ಟಿ ಬದಲಿಸಲು ತಡ ಅಥವಾ ಕಷ್ಟವಾಗುತ್ತದೆಯೇ, ಉದಾಹರಣೆಗೆ ಫೋನಿನಿಂದ ರಸ್ತೆಗೆ?'],o:YNS},
 {id:'symptoms',type:'multi',excl:'none',t:['Do you have any of these at the end of the day?','क्या दिन के आख़िर में आपको इनमें से कुछ होता है?','ದಿನದ ಕೊನೆಯಲ್ಲಿ ನಿಮಗೆ ಇವುಗಳಲ್ಲಿ ಯಾವುದಾದರೂ ಇರುತ್ತದೆಯೇ?'],o:[
  {v:'headache',l:['Headaches','सिरदर्द','ತಲೆನೋವು'],kw:['head','sir','ತಲೆ']},
  {v:'strain',l:['Tired or strained eyes','आँखों में थकान','ಕಣ್ಣು ಆಯಾಸ'],kw:['tired','strain','thakan','ಆಯಾಸ']},
  {v:'water',l:['Watering or itching','पानी आना या खुजली','ನೀರು ಬರುವುದು ಅಥವಾ ತುರಿಕೆ'],kw:['water','itch','khujli','ತುರಿಕೆ','ನೀರು']},
  {v:'light',l:['Bright light is uncomfortable','तेज़ रोशनी से परेशानी','ಪ್ರಖರ ಬೆಳಕು ಕಿರಿಕಿರಿ'],kw:['light','sun','roshni','dhoop','ಬೆಳಕು','ಬಿಸಿಲು']},
  {v:'double',l:['Double vision','दोहरा दिखना','ಎರಡೆರಡು ಕಾಣುವುದು'],kw:['double','do do','ಎರಡೆರಡು']},
  NONE(),
 ]},
 {id:'medical',type:'multi',excl:'none',t:['Do you have any of these health conditions?','क्या आपको इनमें से कोई बीमारी है?','ನಿಮಗೆ ಈ ಆರೋಗ್ಯ ಸಮಸ್ಯೆಗಳಲ್ಲಿ ಯಾವುದಾದರೂ ಇದೆಯೇ?'],o:[
  {v:'diabetes',l:['Diabetes (sugar)','मधुमेह (शुगर)','ಮಧುಮೇಹ (ಶುಗರ್)'],kw:['diabet','sugar','शुगर','ಶುಗರ್','ಮಧುಮೇಹ']},
  {v:'bp',l:['High blood pressure','हाई बीपी','ಅಧಿಕ ರಕ್ತದೊತ್ತಡ'],kw:['bp','pressure','ಬಿಪಿ','ರಕ್ತದೊತ್ತಡ']},
  {v:'unsure',l:['Not sure','पता नहीं','ಗೊತ್ತಿಲ್ಲ'],kw:['not sure','pata nahi','ಗೊತ್ತಿಲ್ಲ']},
  NONE(),
 ]},
 {id:'diab_spots',type:'single',cond:a=>has(a.medical,'diabetes'),rule:'Diabetes → screen for retinopathy symptoms (spots, blurry patches)',t:['Do you see dark spots, floating shapes or blurry patches?','क्या आपको काले धब्बे, तैरती आकृतियाँ या धुंधले हिस्से दिखते हैं?','ನಿಮಗೆ ಕಪ್ಪು ಚುಕ್ಕೆಗಳು, ತೇಲುವ ಆಕಾರಗಳು ಅಥವಾ ಮಸುಕಾದ ಭಾಗಗಳು ಕಾಣುತ್ತವೆಯೇ?'],o:YNS},
 {id:'diab_check',type:'single',cond:a=>has(a.medical,'diabetes'),rule:'Diabetes → ask when the last eye exam was',t:['When did you last have an eye check-up?','आपकी आँखों की आख़िरी जाँच कब हुई थी?','ನಿಮ್ಮ ಕಣ್ಣಿನ ಕೊನೆಯ ತಪಾಸಣೆ ಯಾವಾಗ ಆಗಿತ್ತು?'],o:[
  {v:'lt1',l:['Within the last year','पिछले एक साल में','ಕಳೆದ ಒಂದು ವರ್ಷದೊಳಗೆ'],kw:['year','saal','ವರ್ಷ']},
  {v:'gt1',l:['More than a year ago','1 साल से ज़्यादा पहले','ಒಂದು ವರ್ಷಕ್ಕಿಂತ ಹಿಂದೆ'],kw:['more','pehle','ಹಿಂದೆ']},
  {v:'never',l:['Never','कभी नहीं','ಎಂದೂ ಇಲ್ಲ'],kw:['never','kabhi nahi','ಎಂದೂ']},
 ]},
 {id:'family',type:'multi',excl:'none',t:['Does anyone in your family have glaucoma or blindness?','क्या आपके परिवार में किसी को काला मोतिया (ग्लूकोमा) या अंधापन है?','ನಿಮ್ಮ ಕುಟುಂಬದಲ್ಲಿ ಯಾರಿಗಾದರೂ ಗ್ಲೂಕೋಮಾ ಅಥವಾ ಅಂಧತ್ವ ಇದೆಯೇ?'],o:[
  {v:'glaucoma',l:['Glaucoma','काला मोतिया (ग्लूकोमा)','ಗ್ಲೂಕೋಮಾ'],kw:['glaucoma','kala motia','ಗ್ಲೂಕೋಮಾ']},
  {v:'blind',l:['Blindness','अंधापन','ಅಂಧತ್ವ'],kw:['blind','andha','ಕುರುಡ','ಅಂಧ']},
  {v:'unsure',l:['Not sure','पता नहीं','ಗೊತ್ತಿಲ್ಲ'],kw:['not sure','pata nahi','ಗೊತ್ತಿಲ್ಲ']},
  NONE(),
 ]},
 {id:'redflag',type:'multi',excl:'none',t:['In the last few weeks, have you had any of these?','पिछले कुछ हफ़्तों में क्या आपको इनमें से कुछ हुआ?','ಕಳೆದ ಕೆಲವು ವಾರಗಳಲ್ಲಿ ನಿಮಗೆ ಇವುಗಳಲ್ಲಿ ಯಾವುದಾದರೂ ಆಯಿತೇ?'],o:[
  {v:'sudden',l:['Sudden loss of vision','अचानक दिखना कम होना','ಹಠಾತ್ ದೃಷ್ಟಿ ನಷ್ಟ'],kw:['sudden','achanak','ಹಠಾತ್']},
  {v:'pain',l:['Eye pain or redness','आँख में दर्द या लाली','ಕಣ್ಣು ನೋವು ಅಥವಾ ಕೆಂಪು'],kw:['pain','red','dard','ನೋವು','ಕೆಂಪು']},
  {v:'flash',l:['Flashes of light or many floaters','रोशनी की चमक या बहुत तैरते धब्बे','ಬೆಳಕಿನ ಮಿಂಚು ಅಥವಾ ತೇಲುವ ಚುಕ್ಕೆಗಳು'],kw:['flash','float','chamak','ಮಿಂಚು']},
  {v:'curtain',l:['A shadow or curtain over vision','नज़र पर परछाईं या पर्दा','ದೃಷ್ಟಿಯ ಮೇಲೆ ನೆರಳು ಅಥವಾ ಪರದೆ'],kw:['shadow','curtain','parda','ನೆರಳು','ಪರದೆ']},
  NONE(),
 ]},
 {id:'priority',type:'single',t:['What matters most to you in new glasses?','नए चश्मे में आपके लिए सबसे ज़रूरी क्या है?','ಹೊಸ ಕನ್ನಡಕದಲ್ಲಿ ನಿಮಗೆ ಮುಖ್ಯವಾದುದು ಏನು?'],o:[
  {v:'price',l:['Low cost','कम कीमत','ಕಡಿಮೆ ಬೆಲೆ'],kw:['cheap','cost','price','sasta','kam','ಬೆಲೆ','ಕಡಿಮೆ']},
  {v:'strong',l:['Strong and long-lasting','मज़बूत और टिकाऊ','ಗಟ್ಟಿಮುಟ್ಟು ಮತ್ತು ಬಾಳಿಕೆ'],kw:['strong','mazboot','ಗಟ್ಟಿ']},
  {v:'sun',l:['Protection from sun','धूप से सुरक्षा','ಬಿಸಿಲಿನಿಂದ ರಕ್ಷಣೆ'],kw:['sun','dhoop','ಬಿಸಿಲು']},
  {v:'one',l:['One pair for everything','सब कामों के लिए एक चश्मा','ಎಲ್ಲದಕ್ಕೂ ಒಂದೇ ಕನ್ನಡಕ'],kw:['one','ek','ಒಂದೇ','everything']},
 ]},
];

const QMAP = Object.fromEntries(Q.map(q => [q.id, q]));
// Return the questions that apply to this person right now (adaptive).
const visibleQs = (answers, age) => Q.filter(q => !q.cond || q.cond(answers || {}, +age || 0));
module.exports = { Q, QMAP, H, has, visibleQs };
