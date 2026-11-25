// Google OAuth + Calendar API, used to create Calendar events with a Google Meet link attached.
// Plain fetch against Google's REST endpoints, so no extra dependency.
// Docs: https://developers.google.com/identity/protocols/oauth2/web-server
//       https://developers.google.com/calendar/api/guides/create-events#conferencing
import { config } from '../config.js';

const G = config.google;
const SCOPE = 'https://www.googleapis.com/auth/calendar.events';

export class GoogleError extends Error {
  /** reconnect = the doctor must connect their Google account again (revoked, or expired in "Testing" mode). */
  constructor(message, status = 502, reconnect = false) { super(message); this.status = status; this.reconnect = reconnect; this.expose = true; }
}

/** URL of Google's consent screen. access_type=offline + prompt=consent so Google always returns a refresh token. */
export function authUrl(state) {
  const q = new URLSearchParams({
    client_id: G.clientId, redirect_uri: G.redirectUri, response_type: 'code', scope: SCOPE,
    access_type: 'offline', prompt: 'consent', include_granted_scopes: 'true', state,
  });
  return 'https://accounts.google.com/o/oauth2/v2/auth?' + q;
}

async function tokenRequest(params) {
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ client_id: G.clientId, client_secret: G.clientSecret, ...params }),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    const reconnect = body.error === 'invalid_grant';
    throw new GoogleError(reconnect ? 'Google access expired or was removed. Connect Google again.' : `Google sign-in failed: ${body.error_description || body.error || res.status}`, reconnect ? 409 : 502, reconnect);
  }
  return body;
}

/** Exchange the code from the OAuth callback. Returns { refreshToken, scope }. */
export async function exchangeCode(code) {
  const t = await tokenRequest({ code, redirect_uri: G.redirectUri, grant_type: 'authorization_code' });
  if (!t.refresh_token) throw new GoogleError('Google did not return a refresh token. Remove Eyeze from your Google account permissions and connect again.');
  if (!String(t.scope || '').includes(SCOPE)) throw new GoogleError('Calendar permission was not granted. Connect again and tick the Calendar box.', 400);
  return { refreshToken: t.refresh_token };
}

const accessCache = new Map(); // refreshToken -> { token, until }
async function accessToken(refreshToken) {
  const hit = accessCache.get(refreshToken);
  if (hit && hit.until > Date.now()) return hit.token;
  const t = await tokenRequest({ refresh_token: refreshToken, grant_type: 'refresh_token' });
  accessCache.set(refreshToken, { token: t.access_token, until: Date.now() + (t.expires_in - 120) * 1000 });
  return t.access_token;
}

async function calendar(refreshToken, path, init = {}) {
  const res = await fetch('https://www.googleapis.com/calendar/v3' + path, {
    ...init,
    headers: { Authorization: 'Bearer ' + await accessToken(refreshToken), 'Content-Type': 'application/json', ...(init.headers || {}) },
  });
  const body = await res.json().catch(() => ({}));
  if (res.status === 401) { accessCache.delete(refreshToken); throw new GoogleError('Google access expired. Connect Google again.', 409, true); }
  if (!res.ok) throw new GoogleError(`Google Calendar: ${body.error?.message || res.status}`, res.status === 403 ? 403 : 502);
  return body;
}

const meetLink = ev => ev.hangoutLink || ev.conferenceData?.entryPoints?.find(e => e.entryPointType === 'video')?.uri || null;

/**
 * Create an event on the doctor's primary calendar with a Google Meet conference attached.
 * Returns { eventId, meetLink, htmlLink }.
 */
export async function createMeetEvent(refreshToken, { summary, description, startsAt, durationMin, requestId }) {
  const start = new Date(startsAt), end = new Date(start.getTime() + durationMin * 60_000);
  let ev = await calendar(refreshToken, '/calendars/primary/events?conferenceDataVersion=1', {
    method: 'POST',
    body: JSON.stringify({
      summary, description,
      start: { dateTime: start.toISOString(), timeZone: 'Asia/Kolkata' },
      end: { dateTime: end.toISOString(), timeZone: 'Asia/Kolkata' },
      conferenceData: { createRequest: { requestId, conferenceSolutionKey: { type: 'hangoutsMeet' } } },
      reminders: { useDefault: false, overrides: [{ method: 'popup', minutes: 10 }] },
    }),
  });
  // Meet creation is usually immediate, but Google may report it as "pending" for a moment.
  for (let i = 0; i < 3 && !meetLink(ev) && ev.conferenceData?.createRequest?.status?.statusCode === 'pending'; i++) {
    await new Promise(r => setTimeout(r, 800));
    ev = await calendar(refreshToken, `/calendars/primary/events/${encodeURIComponent(ev.id)}`);
  }
  const link = meetLink(ev);
  if (!link) throw new GoogleError('Google created the event but no Meet link. Check that Google Meet is enabled for this Google account.');
  return { eventId: ev.id, meetLink: link, htmlLink: ev.htmlLink };
}
