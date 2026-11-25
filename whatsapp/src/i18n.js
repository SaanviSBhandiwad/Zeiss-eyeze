// All bot-owned text, [English, Hindi, Kannada]. Question text lives in questions.js.
const LANGS = ['en', 'hi', 'kn'];
const M = {
  welcome: [
    '👁️ *DrishtiSetu*\nChoose your language / भाषा चुनें / ಭಾಷೆ ಆಯ್ಕೆಮಾಡಿ\n\n1️⃣ English\n2️⃣ हिन्दी\n3️⃣ ಕನ್ನಡ',
  ],
  consent: [
    'I will ask you some questions about your daily life and your eyes. Your answers go only to a qualified optometrist. This is a screening, not a full eye exam.\n\nReply *1* to start.',
    'मैं आपसे आपकी दिनचर्या और आँखों के बारे में कुछ सवाल पूछूँगी। आपके जवाब सिर्फ़ एक योग्य ऑप्टोमेट्रिस्ट को भेजे जाएँगे। यह शुरुआती जाँच है, आँखों की पूरी जाँच नहीं।\n\nशुरू करने के लिए *1* भेजें।',
    'ನಾನು ನಿಮ್ಮ ದಿನಚರಿ ಮತ್ತು ಕಣ್ಣುಗಳ ಬಗ್ಗೆ ಕೆಲವು ಪ್ರಶ್ನೆಗಳನ್ನು ಕೇಳುತ್ತೇನೆ. ನಿಮ್ಮ ಉತ್ತರಗಳು ಅರ್ಹ ಆಪ್ಟೋಮೆಟ್ರಿಸ್ಟ್‌ಗೆ ಮಾತ್ರ ಹೋಗುತ್ತವೆ. ಇದು ಪ್ರಾಥಮಿಕ ತಪಾಸಣೆ, ಪೂರ್ಣ ಕಣ್ಣಿನ ಪರೀಕ್ಷೆಯಲ್ಲ.\n\nಪ್ರಾರಂಭಿಸಲು *1* ಕಳುಹಿಸಿ.',
  ],
  askName: ['What is your name?', 'आपका नाम क्या है?', 'ನಿಮ್ಮ ಹೆಸರೇನು?'],
  askAge: ['Nice to meet you, {name}. How old are you? (type a number)', '{name}, आपकी उम्र कितनी है? (संख्या लिखें)', '{name}, ನಿಮ್ಮ ವಯಸ್ಸು ಎಷ್ಟು? (ಸಂಖ್ಯೆ ಬರೆಯಿರಿ)'],
  badAge: ['Please type your age as a number, like 45.', 'कृपया उम्र संख्या में लिखें, जैसे 45।', 'ದಯವಿಟ್ಟು ವಯಸ್ಸನ್ನು ಸಂಖ್ಯೆಯಲ್ಲಿ ಬರೆಯಿರಿ, ಉದಾ 45.'],
  single: ['Reply with one number.', 'एक नंबर भेजें।', 'ಒಂದು ಸಂಖ್ಯೆ ಕಳುಹಿಸಿ.'],
  multi: ['Reply with all that apply, like *1,3*.', 'जो लागू हों वे सब भेजें, जैसे *1,3*।', 'ಅನ್ವಯಿಸುವ ಎಲ್ಲವನ್ನೂ ಕಳುಹಿಸಿ, ಉದಾ *1,3*.'],
  retry: ['Sorry, I did not understand that.', 'माफ़ कीजिए, मैं समझ नहीं पाई।', 'ಕ್ಷಮಿಸಿ, ನನಗೆ ಅರ್ಥವಾಗಲಿಲ್ಲ.'],
  voiceOn: ['🔊 Voice replies are ON. I will read each question aloud. Send *text* to turn it off.', '🔊 वॉइस जवाब चालू हैं। मैं हर सवाल बोलकर सुनाऊँगी। बंद करने के लिए *text* भेजें।', '🔊 ಧ್ವನಿ ಉತ್ತರ ಆನ್ ಆಗಿದೆ. ನಾನು ಪ್ರತಿ ಪ್ರಶ್ನೆಯನ್ನು ಓದಿ ಹೇಳುತ್ತೇನೆ. ಆಫ್ ಮಾಡಲು *text* ಕಳುಹಿಸಿ.'],
  voiceOff: ['Voice replies are OFF. Send *voice* to turn them on.', 'वॉइस जवाब बंद हैं। चालू करने के लिए *voice* भेजें।', 'ಧ್ವನಿ ಉತ್ತರ ಆಫ್ ಆಗಿದೆ. ಆನ್ ಮಾಡಲು *voice* ಕಳುಹಿಸಿ.'],
  voice: ['I cannot listen to voice notes yet. Please reply with a number.', 'मैं अभी वॉइस नोट नहीं सुन सकती। कृपया नंबर भेजें।', 'ನಾನು ಇನ್ನೂ ವಾಯ್ಸ್ ನೋಟ್ ಕೇಳಲಾರೆ. ದಯವಿಟ್ಟು ಸಂಖ್ಯೆ ಕಳುಹಿಸಿ.'],
  urgent: ['🔴 *Important:* what you described can be serious. Please go to an eye hospital today. We will still finish your profile.', '🔴 *ज़रूरी:* जो आपने बताया वह गंभीर हो सकता है। कृपया आज ही आँखों के अस्पताल जाएँ। हम आपकी प्रोफ़ाइल पूरी करेंगे।', '🔴 *ಮುಖ್ಯ:* ನೀವು ಹೇಳಿದ್ದು ಗಂಭೀರವಾಗಿರಬಹುದು. ದಯವಿಟ್ಟು ಇಂದೇ ಕಣ್ಣಿನ ಆಸ್ಪತ್ರೆಗೆ ಹೋಗಿ. ನಾವು ನಿಮ್ಮ ಪ್ರೊಫೈಲ್ ಪೂರ್ಣಗೊಳಿಸುತ್ತೇವೆ.'],
  hint: ['_Send *back* to change your last answer._', '_पिछला जवाब बदलने के लिए *back* भेजें।_', '_ಹಿಂದಿನ ಉತ್ತರ ಬದಲಿಸಲು *back* ಕಳುಹಿಸಿ._'],
  profileTitle: ['Your Vision Profile', 'आपकी विज़न प्रोफ़ाइल', 'ನಿಮ್ಮ ದೃಷ್ಟಿ ಪ್ರೊಫೈಲ್'],
  dominance: ['Where your eyes work hardest', 'आपकी आँखें सबसे ज़्यादा कहाँ काम करती हैं', 'ನಿಮ್ಮ ಕಣ್ಣುಗಳು ಹೆಚ್ಚು ಕೆಲಸ ಮಾಡುವುದು'],
  near: ['Near', 'पास', 'ಹತ್ತಿರ'], mid: ['Middle', 'बीच', 'ಮಧ್ಯ'], far: ['Far', 'दूर', 'ದೂರ'],
  level: { green: ['🟢 Low concern', '🟢 कम चिंता', '🟢 ಕಡಿಮೆ ಕಾಳಜಿ'], amber: ['🟡 Needs an eye check soon', '🟡 जल्द आँख जाँच कराएँ', '🟡 ಶೀಘ್ರದಲ್ಲಿ ಕಣ್ಣಿನ ತಪಾಸಣೆ ಬೇಕು'], red: ['🔴 See an eye doctor urgently', '🔴 तुरंत आँखों के डॉक्टर को दिखाएँ', '🔴 ತುರ್ತಾಗಿ ಕಣ್ಣಿನ ವೈದ್ಯರನ್ನು ಕಾಣಿ'] },
  lensLine: ['Likely lens type', 'संभावित लेंस', 'ಸಂಭಾವ್ಯ ಲೆನ್ಸ್'],
  tipsTitle: ['Tips for you', 'आपके लिए सुझाव', 'ನಿಮಗಾಗಿ ಸಲಹೆಗಳು'],
  sent: ['✅ Your profile has been sent to an optometrist. You will get a reply here.\n_This is a screening, not a diagnosis._', '✅ आपकी प्रोफ़ाइल ऑप्टोमेट्रिस्ट को भेज दी गई है। जवाब यहीं मिलेगा।\n_यह शुरुआती जाँच है, निदान नहीं।_', '✅ ನಿಮ್ಮ ಪ್ರೊಫೈಲ್ ಆಪ್ಟೋಮೆಟ್ರಿಸ್ಟ್‌ಗೆ ಕಳುಹಿಸಲಾಗಿದೆ. ಉತ್ತರ ಇಲ್ಲೇ ಬರುತ್ತದೆ.\n_ಇದು ಪ್ರಾಥಮಿಕ ತಪಾಸಣೆ, ರೋಗನಿರ್ಣಯವಲ್ಲ._'],
  again: ['Send *hi* to start again.', 'फिर से शुरू करने के लिए *hi* भेजें।', 'ಮತ್ತೆ ಪ್ರಾರಂಭಿಸಲು *hi* ಕಳುಹಿಸಿ.'],
};
const t = (key, li) => { const v = M[key]; return v[li] ?? v[0]; };
module.exports = { M, t, LANGS };