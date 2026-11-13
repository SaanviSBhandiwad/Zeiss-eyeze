// HTTP client for the Express API.
// VITE_API_URL is the Render web service URL in production; in development Vite proxies /api.
export const API_BASE = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');

/** Server-relative links (e.g. locally stored audio) need the API host in front. */
export const absUrl = u => (u && u.startsWith('/') ? API_BASE + u : u);

export class ApiError extends Error {
  constructor(message, status, body) { super(message); this.status = status; this.body = body; }
}

export async function api(path, { method = 'GET', body, token, form } = {}) {
  const headers = {};
  if (token) headers.Authorization = 'Bearer ' + token;
  if (body !== undefined && !form) headers['Content-Type'] = 'application/json';
  let res;
  try {
    res = await fetch(API_BASE + '/api' + path, { method, headers, body: form || (body !== undefined ? JSON.stringify(body) : undefined) });
  } catch (e) {
    throw new ApiError('Network error', 0, null); // offline or server unreachable
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(data.error || `Request failed (${res.status})`, res.status, data);
  return data;
}

let cfgPromise;
/** Which services the server has switched on: { mode, sarvam, storage, supabase }. */
export function getConfig() {
  cfgPromise ||= api('/config').catch(() => ({ mode: 'offline', sarvam: false, storage: 'local', supabase: null }));
  return cfgPromise;
}
