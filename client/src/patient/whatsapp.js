// "Chat on WhatsApp": a wa.me link to the Drishti WhatsApp bot. The number (and, for the Twilio sandbox, the
// join code) come from the server's /api/config, so nothing is hard-coded and the button hides when unset.
import { useEffect, useState } from 'react';
import { getConfig } from '../lib/api.js';

/** { href, sandbox } or null when the server has no WhatsApp number configured. */
export function useWhatsApp() {
  const [wa, setWa] = useState(null);
  useEffect(() => {
    let live = true;
    getConfig().then(c => {
      const w = c?.whatsapp;
      if (!live || !w?.number) return;
      // Sandbox: the first message must be "join <code>"; otherwise any greeting starts the bot.
      const text = w.join ? `join ${w.join}` : 'hi';
      setWa({ href: `https://wa.me/${w.number.replace(/\D/g, '')}?text=${encodeURIComponent(text)}`, sandbox: !!w.join });
    }).catch(() => {});
    return () => { live = false; };
  }, []);
  return wa;
}
