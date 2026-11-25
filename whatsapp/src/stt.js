// Speech -> text with automatic fallbacks and clear logging.
// WhatsApp voice notes are OGG/Opus, but the sample rate and the best model vary,
// so instead of guessing one setting we try a short list and use the first that returns text.

function encodingFor(contentType) {
  const c = contentType || '';
  if (/audio\/ogg/i.test(c)) return 'OGG_OPUS';
  if (/audio\/webm/i.test(c)) return 'WEBM_OPUS';
  if (/audio\/mpeg|audio\/mp3/i.test(c)) return 'MP3';
  if (/audio\/(x-)?wav/i.test(c)) return 'LINEAR16';
  throw new Error(`Unsupported audio type: ${contentType}`);
}

// phrases: words we expect (the current question's options). Hints make short answers far more accurate.
async function transcribe(client, audioBuffer, contentType, languageCode, phrases = [], budgetMs = 9000) {
  const encoding = encodingFor(contentType);
  const uniq = [...new Set(phrases.map(p => String(p).trim()).filter(Boolean))].slice(0, 80);
  const speechContexts = uniq.length ? [{ phrases: uniq }] : undefined;
  const base = { encoding, languageCode, enableAutomaticPunctuation: false };
  const rate = r => (encoding.endsWith('OPUS') ? { sampleRateHertz: r } : {});

  const attempts = [
    { name: '16k + latest_short + hints', cfg: { ...base, ...rate(16000), model: 'latest_short', speechContexts } },
    { name: '48k + latest_short + hints', cfg: { ...base, ...rate(48000), model: 'latest_short', speechContexts } },
    { name: '16k + default model + hints', cfg: { ...base, ...rate(16000), speechContexts } },
    { name: '48k + default model, no hints', cfg: { ...base, ...rate(48000) } },
  ];

  const started = Date.now();
  const content = audioBuffer.toString('base64');
  for (const a of attempts) {
    if (Date.now() - started > budgetMs) { console.log('STT: time budget used up, stopping'); break; }
    try {
      const [res] = await client.recognize({ config: a.cfg, audio: { content } });
      const text = (res.results || []).map(r => r.alternatives?.[0]?.transcript || '').join(' ').trim();
      console.log(`STT [${a.name}] ->`, text ? JSON.stringify(text) : '(empty result)');
      if (text) return text;
    } catch (e) {
      console.log(`STT [${a.name}] FAILED: ${e.message}`);
    }
  }
  return '';
}

module.exports = { transcribe, encodingFor };