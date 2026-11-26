// Text for returning patients (My reports, check status, sign out) and the optometrist entry point.
// Kept in its own file so it doesn't collide with other branches editing i18n.js.
import { T } from './i18n.js';

Object.assign(T, {
myReports: ['My reports', 'मेरी रिपोर्ट', 'ನನ್ನ ವರದಿಗಳು'],
myReportsSub: ['Every eye check you sent, and what the optometrist said.', 'आपकी भेजी हर आँख जाँच, और ऑप्टोमेट्रिस्ट का जवाब।', 'ನೀವು ಕಳುಹಿಸಿದ ಪ್ರತಿ ಕಣ್ಣಿನ ತಪಾಸಣೆ ಮತ್ತು ಆಪ್ಟೋಮೆಟ್ರಿಸ್ಟ್ ಉತ್ತರ.'],
seeMyReports: ['See my reports', 'मेरी रिपोर्ट देखें', 'ನನ್ನ ವರದಿಗಳನ್ನು ನೋಡಿ'],
welcomeBack: ['Welcome back{name}', 'फिर से स्वागत है{name}', 'ಮತ್ತೆ ಸ್ವಾಗತ{name}'],
checkStatus: ['Sent a report before? Check its status', 'पहले रिपोर्ट भेजी थी? उसकी स्थिति देखें', 'ಹಿಂದೆ ವರದಿ ಕಳುಹಿಸಿದ್ದೀರಾ? ಅದರ ಸ್ಥಿತಿ ನೋಡಿ'],
statusTitle: ['See your reports', 'अपनी रिपोर्ट देखें', 'ನಿಮ್ಮ ವರದಿಗಳನ್ನು ನೋಡಿ'],
statusSub: ['Enter the phone number you used when you sent your report.', 'वही फ़ोन नंबर डालें जिससे आपने रिपोर्ट भेजी थी।', 'ವರದಿ ಕಳುಹಿಸುವಾಗ ಬಳಸಿದ ಫೋನ್ ಸಂಖ್ಯೆಯನ್ನು ನಮೂದಿಸಿ.'],
noReports: ['No reports sent from this number yet.', 'इस नंबर से अभी तक कोई रिपोर्ट नहीं भेजी गई।', 'ಈ ಸಂಖ್ಯೆಯಿಂದ ಇನ್ನೂ ಯಾವುದೇ ವರದಿ ಕಳುಹಿಸಿಲ್ಲ.'],
newCheck: ['Start a new eye check', 'नई आँख जाँच शुरू करें', 'ಹೊಸ ಕಣ್ಣಿನ ತಪಾಸಣೆ ಆರಂಭಿಸಿ'],
signOutP: ['Sign out', 'साइन आउट', 'ಸೈನ್ ಔಟ್'],
signedOut: ['Signed out', 'साइन आउट हो गया', 'ಸೈನ್ ಔಟ್ ಆಗಿದೆ'],
reportOn: ['Report of {d}', '{d} की रिपोर्ट', '{d} ರ ವರದಿ'],
waitingReply: ['Waiting for the optometrist’s reply.', 'ऑप्टोमेट्रिस्ट के जवाब का इंतज़ार है।', 'ಆಪ್ಟೋಮೆಟ್ರಿಸ್ಟ್ ಉತ್ತರಕ್ಕಾಗಿ ಕಾಯಲಾಗುತ್ತಿದೆ.'],
showReply: ['Show reply', 'जवाब देखें', 'ಉತ್ತರ ನೋಡಿ'],
hideReply: ['Hide reply', 'जवाब छिपाएँ', 'ಉತ್ತರ ಮರೆಮಾಡಿ'],
loading: ['Loading…', 'लोड हो रहा है…', 'ಲೋಡ್ ಆಗುತ್ತಿದೆ…'],
loadFail: ['Could not load your reports. Check your connection.', 'रिपोर्ट लोड नहीं हो सकीं। इंटरनेट जाँचें।', 'ವರದಿಗಳನ್ನು ಲೋಡ್ ಮಾಡಲಾಗಲಿಲ್ಲ. ಸಂಪರ್ಕ ಪರಿಶೀಲಿಸಿ.'],
optLogin: ['Optometrist login', 'ऑप्टोमेट्रिस्ट लॉगिन', 'ಆಪ್ಟೋಮೆಟ್ರಿಸ್ಟ್ ಲಾಗಿನ್'],
optShort: ['Optometrist', 'ऑप्टोमेट्रिस्ट', 'ಆಪ್ಟೋಮೆಟ್ರಿಸ್ಟ್'],
demoPhone: ['Demo: use the number {p}', 'डेमो: यह नंबर इस्तेमाल करें {p}', 'ಡೆಮೊ: ಈ ಸಂಖ್ಯೆ ಬಳಸಿ {p}'],
useDemoPhone: ['Use demo number', 'डेमो नंबर डालें', 'ಡೆಮೊ ಸಂಖ್ಯೆ ಬಳಸಿ'],
demoOtpIs: ['Demo OTP: {c}', 'डेमो OTP: {c}', 'ಡೆಮೊ OTP: {c}'],
});
