// Demo-mode live updates over Server-Sent Events. In Supabase mode the browser uses Supabase Realtime instead.
// EventSource can't send headers, so the token comes in the query string.
import { Router } from 'express';
import { resolveUser } from '../services/auth.js';
import { changes, store } from '../services/store.js';
import { useSupabase } from '../config.js';

export const eventsRouter = Router();

eventsRouter.get('/', async (req, res) => {
  if (useSupabase) return res.status(404).end();
  const user = await resolveUser(String(req.query.token || ''));
  if (!user) return res.status(401).end();
  res.set({ 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', Connection: 'keep-alive', 'X-Accel-Buffering': 'no' });
  res.flushHeaders();
  res.write('retry: 3000\n\n');
  const send = ev => {
    if (user.role === 'patient' && ev.patientId !== user.id) return;
    res.write(`event: change\ndata: ${JSON.stringify({ profileId: ev.profileId })}\n\n`);
  };
  changes.on('change', send);
  const ping = setInterval(() => res.write(': ping\n\n'), 25_000);
  req.on('close', () => { clearInterval(ping); changes.off('change', send); });
});

/* Demo-only: reset the in-memory queue to the mock patients. */
eventsRouter.post('/reset', async (req, res) => {
  if (useSupabase || !store.reset) return res.status(404).end();
  await store.reset();
  res.json({ ok: true });
});
