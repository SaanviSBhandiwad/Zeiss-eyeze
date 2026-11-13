// Resolves the caller from the Authorization header.
// Supabase mode: a Supabase access token (phone OTP for patients, email+password for optometrists).
// Demo mode: a token signed by this server (see routes/auth.js).
import { useSupabase } from '../config.js';
import { admin } from './supabase.js';
import { verifyToken } from './sign.js';

const cache = new Map(); // token -> { user, until }

export async function resolveUser(token) {
  if (!token) return null;
  if (!useSupabase) {
    const p = verifyToken(token);
    return p ? { id: p.sub, role: p.role, phone: p.phone || null, email: p.email || null, name: p.name || null } : null;
  }
  const hit = cache.get(token);
  if (hit && hit.until > Date.now()) return hit.user;
  const { data, error } = await admin.auth.getUser(token);
  if (error || !data?.user) return null;
  const u = data.user;
  const { data: opt } = await admin.from('optometrists').select('id,name').eq('id', u.id).maybeSingle();
  const user = { id: u.id, role: opt ? 'optometrist' : 'patient', phone: u.phone ? '+' + u.phone.replace(/^\+/, '') : null, email: u.email || null, name: opt?.name || null };
  cache.set(token, { user, until: Date.now() + 60_000 });
  if (cache.size > 2000) cache.delete(cache.keys().next().value);
  return user;
}

const bearer = req => (req.headers.authorization || '').replace(/^Bearer\s+/i, '') || null;

/** Attach req.user if a valid token is present; never rejects. */
export async function optionalAuth(req, _res, next) {
  try { req.user = await resolveUser(bearer(req)); } catch { req.user = null; }
  next();
}

/** Require a signed-in user, optionally with a specific role. */
export const requireAuth = role => async (req, res, next) => {
  try { req.user = await resolveUser(bearer(req)); } catch { req.user = null; }
  if (!req.user) return res.status(401).json({ error: 'Sign in required' });
  if (role && req.user.role !== role) return res.status(403).json({ error: 'Not allowed' });
  next();
};
