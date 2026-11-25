// Run:  node test/tts-check.js
// Makes one MP3 per language so you can LISTEN and confirm Google has a voice for each.
const fs = require('fs');
require('dotenv').config();
const { speak, AUDIO_DIR } = require('../src/tts');
const lines = ['Hello! Welcome to DrishtiSetu. Let us begin your vision screening.', 'नमस्ते! दृष्टिसेतु में आपका स्वागत है। चलिए आपकी आँखों की जाँच शुरू करते हैं।', 'ನಮಸ್ಕಾರ! ದೃಷ್ಟಿಸೇತುಗೆ ಸ್ವಾಗತ. ನಿಮ್ಮ ಕಣ್ಣಿನ ತಪಾಸಣೆಯನ್ನು ಪ್ರಾರಂಭಿಸೋಣ.'];
(async () => {
  for (let i = 0; i < 3; i++) {
    try { const f = await speak(lines[i], i); console.log('OK  ', ['English', 'Hindi', 'Kannada'][i], '->', AUDIO_DIR + '/' + f); }
    catch (e) { console.log('FAIL', ['English', 'Hindi', 'Kannada'][i], e.message); }
  }
})();