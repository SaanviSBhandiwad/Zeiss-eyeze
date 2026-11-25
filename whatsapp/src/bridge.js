// Bridge to the Eyeze app: sends each finished WhatsApp profile to the main server, so it lands in the same
// optometrist queue as app reports (same triage engine, same portal). The optometrist's reply comes back
// through POST /api/profiles/:phone/reply on this bot (see server.js), which sends it on WhatsApp.
//
// Needs EYEZE_API_URL (e.g. https://eyeze-api.onrender.com) and WHATSAPP_BRIDGE_KEY (the same value on both
// services). Without them the bot still works on its own and keeps profiles in data/profiles.json.
const axios = require('axios');

const enabled = () => !!(process.env.EYEZE_API_URL && process.env.WHATSAPP_BRIDGE_KEY);

/** Push one finished session. Resolves to the Eyeze profile id, or null if the bridge is off or failed. */
async function pushProfile(phone, s) {
  if (!enabled()) return null;
  const url = process.env.EYEZE_API_URL.replace(/\/$/, '') + '/api/integrations/whatsapp';
  const body = { phone, name: s.name, age: s.age, lang: ['en', 'hi', 'kn'][s.lang] || 'en', answers: s.answers, finishedAt: s.finishedAt };
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const r = await axios.post(url, body, { headers: { 'x-bridge-key': process.env.WHATSAPP_BRIDGE_KEY }, timeout: 15000 });
      console.log('Bridge: profile sent to Eyeze as', r.data?.profile?.pid || r.data?.profile?.id);
      return r.data?.profile?.id || null;
    } catch (e) {
      const status = e.response?.status;
      console.error(`Bridge: send failed (attempt ${attempt}):`, status || e.message);
      if (status && status < 500) return null;                     // bad key / bad data: retrying won't help
      await new Promise(r => setTimeout(r, 1500 * attempt));       // Render free services can take a while to wake
    }
  }
  return null;
}

module.exports = { pushProfile, enabled };
