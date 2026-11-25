// Sends an optometrist's reply to a WhatsApp patient, through the WhatsApp bot service (whatsapp/), which owns
// the Twilio number and the Google voice. Returns { ok } or { ok: false, error } and never throws.
import { config } from '../config.js';

export async function sendWhatsAppReply(profile, text) {
  const { botUrl, bridgeKey } = config.whatsapp;
  if (!botUrl || !bridgeKey) return { ok: false, error: 'WHATSAPP_BOT_URL is not set, so the reply was saved but not sent on WhatsApp' };
  if (!profile.phone) return { ok: false, error: 'no phone number on this report' };
  try {
    const to = encodeURIComponent('whatsapp:' + profile.phone);
    const r = await fetch(`${botUrl}/api/profiles/${to}/reply`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-api-key': bridgeKey },
      body: JSON.stringify({ text, lang: profile.lang || 'en' }),
      signal: AbortSignal.timeout(30000),
    });
    const body = await r.json().catch(() => ({}));
    if (!r.ok || body.ok === false) return { ok: false, error: body.error || `bot answered ${r.status}` };
    if (body.sent === false) return { ok: false, error: body.note || 'the bot has no Twilio credentials, so nothing was sent' };
    return { ok: true };
  } catch (e) {
    return { ok: false, error: 'could not reach the WhatsApp bot (' + e.message + ')' };
  }
}
