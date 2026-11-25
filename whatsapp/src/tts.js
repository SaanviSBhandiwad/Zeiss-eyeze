// Text -> speech (Google Cloud TTS). Makes an MP3 and returns its filename.
// Files are cached by (language + text), so a question is only synthesized once, ever.
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const AUDIO_DIR = path.join(__dirname, '..', 'data', 'audio');
const LANG_CODES = ['en-IN', 'hi-IN', 'kn-IN'];            // same order as session.lang
fs.mkdirSync(AUDIO_DIR, { recursive: true });

let ttsClient = null;
const getClient = () => {
  if (!ttsClient) { const { TextToSpeechClient } = require('@google-cloud/text-to-speech'); ttsClient = new TextToSpeechClient(); }
  return ttsClient;
};

// Turn a WhatsApp message into something a voice can read naturally.
function toSpeech(text) {
  return text
    .replace(/(\d)\uFE0F?\u20E3/g, '$1.')                  // "1️⃣" -> "1."
    .split('\n').filter(l => !/[█░]/.test(l)).join('\n')   // drop the % bar lines
    .replace(/\p{Extended_Pictographic}|\uFE0F|\u200D/gu, '') // emojis
    .replace(/[*_~`]/g, '')                                 // WhatsApp formatting marks
    .replace(/\n{2,}/g, '. \n').replace(/\n/g, ' ')
    .replace(/\s{2,}/g, ' ').trim();
}

async function speak(text, langIndex) {
  const spoken = toSpeech(text).slice(0, 900);             // keep clips short
  if (!spoken) return null;
  const code = LANG_CODES[langIndex] || 'en-IN';
  const name = crypto.createHash('sha1').update(code + '|' + spoken).digest('hex').slice(0, 24) + '.mp3';
  const file = path.join(AUDIO_DIR, name);
  if (fs.existsSync(file)) return name;                     // cache hit

  if (process.env.DS_TTS_STUB === '1') { fs.writeFileSync(file, Buffer.from('ID3-stub')); return name; } // for tests only

  const [res] = await getClient().synthesizeSpeech({
    input: { text: spoken },
    voice: { languageCode: code, ssmlGender: 'FEMALE' },
    audioConfig: { audioEncoding: 'MP3', speakingRate: 0.9 }, // a little slower is easier to follow
  });
  fs.writeFileSync(file, res.audioContent);
  return name;
}

// Don't let a slow TTS call make Twilio time out (it gives up after ~15 s).
const withTimeout = (p, ms) => Promise.race([p, new Promise((_, rej) => setTimeout(() => rej(new Error('TTS timeout')), ms))]);

module.exports = { speak, toSpeech, withTimeout, AUDIO_DIR, LANG_CODES };