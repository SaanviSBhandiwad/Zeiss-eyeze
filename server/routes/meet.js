// Google Meet booking (phase 3).
// The doctor connects their Google account once (OAuth). After that, "Book call" creates a Calendar
// event with a Meet conference attached, Google returns the Meet link, and it is saved in `consultations`.
// The patient app shows a "Join Google Meet" card through the normal realtime refresh.
import { Router } from 'express';
import crypto from 'node:crypto';
import { config, useGoogle } from '../config.js';
import { requireAuth } from '../services/auth.js';
import { store } from '../services/store.js';
import { signToken, verifyToken } from '../services/sign.js';
import { authUrl, exchangeCode, createMeetEvent, GoogleError } from '../services/google.js';

export const meetRouter = Router();

const notConfigured = res => res.status(503).json({ error: 'Google Meet is not set up on the server (GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI).' });

/** Where to send the doctor back to after Google: the portal origin they came from, if it's an allowed one. */
const portalOrigin = o => (config.clientOrigins.includes(o) ? o : config.clientOrigins[0]);

/* Is Google set up on the server, and has this doctor connected their account? */
meetRouter.get('/status', requireAuth('optometrist'), async (req, res, next) => {
  try {
    if (!useGoogle) return res.json({ configured: false, connected: false });
    res.json({ configured: true, connected: !!(await store.getGoogle(req.user.id)) });
  } catch (e) { next(e); }
});

/* Start connecting: returns Google's consent URL. The browser navigates there (it can't follow a link with a Bearer header). */
meetRouter.get('/connect', requireAuth('optometrist'), (req, res) => {
  if (!useGoogle) return notConfigured(res);
  const state = signToken({ sub: req.user.id, purpose: 'google', origin: portalOrigin(req.get('origin')) }, 600);
  res.json({ url: authUrl(state) });
});

/* Google redirects here after the doctor approves (or cancels). */
meetRouter.get('/oauth/callback', async (req, res) => {
  const st = verifyToken(String(req.query.state || ''));
  const back = (result, msg) => res.redirect(`${portalOrigin(st?.origin)}/optometrist?google=${result}${msg ? '&msg=' + encodeURIComponent(msg) : ''}`);
  if (!useGoogle) return notConfigured(res);
  if (!st || st.purpose !== 'google') return back('error', 'The sign-in link expired. Try connecting again.');
  if (req.query.error) return back('cancelled');
  try {
    const { refreshToken } = await exchangeCode(String(req.query.code || ''));
    await store.saveGoogle(st.sub, refreshToken);
    back('connected');
  } catch (e) {
    console.error('Google connect failed:', e.message);
    back('error', e instanceof GoogleError ? e.message : 'Could not connect Google.');
  }
});

/* Disconnect (e.g. to switch Google accounts). */
meetRouter.delete('/connect', requireAuth('optometrist'), async (req, res, next) => {
  try { await store.deleteGoogle(req.user.id); res.json({ ok: true }); } catch (e) { next(e); }
});

/* Book a video call for a report. Body: { startsAt: ISO time, durationMin: 10-60 } */
meetRouter.post('/:profileId', requireAuth('optometrist'), async (req, res, next) => {
  try {
    if (!useGoogle) return notConfigured(res);
    const p = await store.getProfile(req.params.profileId);
    if (!p) return res.status(404).json({ error: 'Not found' });

    const startsAt = Date.parse(req.body?.startsAt);
    const durationMin = Math.round(Number(req.body?.durationMin) || 15);
    if (!Number.isFinite(startsAt)) return res.status(400).json({ error: 'Choose a date and time' });
    if (startsAt < Date.now() - 5 * 60_000) return res.status(400).json({ error: 'That time is in the past' });
    if (startsAt > Date.now() + 90 * 24 * 3600_000) return res.status(400).json({ error: 'Choose a time within the next 90 days' });
    if (durationMin < 10 || durationMin > 60) return res.status(400).json({ error: 'Duration must be 10 to 60 minutes' });

    const refreshToken = await store.getGoogle(req.user.id);
    if (!refreshToken) return res.status(409).json({ error: 'Connect your Google account first', reconnect: true });

    let ev;
    try {
      ev = await createMeetEvent(refreshToken, {
        // Keep health details out of the calendar: name and report ID only.
        summary: `Eyeze eye consultation: ${p.name}${p.pid ? ' (' + p.pid + ')' : ''}`,
        description: 'Video consultation booked through the Eyeze optometrist portal. The patient joins from the Eyeze app.',
        startsAt, durationMin, requestId: crypto.randomUUID(),
      });
    } catch (e) {
      if (e instanceof GoogleError && e.reconnect) await store.deleteGoogle(req.user.id).catch(() => {});
      if (e instanceof GoogleError) return res.status(e.status).json({ error: e.message, reconnect: e.reconnect });
      throw e;
    }

    await store.addConsultation({ profileId: p.id, optometristId: req.user.id, startsAt, durationMin, meetLink: ev.meetLink, eventId: ev.eventId });
    res.json({ profile: await store.getProfile(p.id), calendarLink: ev.htmlLink });
  } catch (e) { next(e); }
});
