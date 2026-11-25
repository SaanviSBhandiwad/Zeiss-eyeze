// Live updates. Calls onChange() whenever a report or reply the user can see changes;
// the caller then refetches from the API (which stays the single source of truth).
// Supabase mode: Supabase Realtime (RLS limits patients to their own rows).
// Demo mode: Server-Sent Events from the Express server.
import { API_BASE, getConfig } from './api.js';
import { getToken, supabaseFor } from './auth.js';

export function subscribe(role, onChange) {
  let stop = () => {};
  let closed = false;
  (async () => {
    const cfg = await getConfig();
    const token = await getToken(role);
    if (closed || !token) return;
    if (cfg.supabase) {
      const s = await supabaseFor(role);
      s.realtime.setAuth(token);
      const ch = s.channel('eyeze-' + role + '-' + Math.random().toString(36).slice(2))
        .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => onChange())
        .on('postgres_changes', { event: '*', schema: 'public', table: 'replies' }, () => onChange())
        .on('postgres_changes', { event: '*', schema: 'public', table: 'consultations' }, () => onChange())
        .subscribe();
      stop = () => s.removeChannel(ch);
    } else {
      const es = new EventSource(`${API_BASE}/api/events?token=${encodeURIComponent(token)}`);
      es.addEventListener('change', () => onChange());
      stop = () => es.close();
    }
    if (closed) stop();
  })();
  return () => { closed = true; stop(); };
}
