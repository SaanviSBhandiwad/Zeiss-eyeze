// HMAC helpers for demo-mode tokens and signed local-storage URLs.
import crypto from 'node:crypto';
import { config } from '../config.js';

const b64 = buf => Buffer.from(buf).toString('base64url');
const mac = s => crypto.createHmac('sha256', config.demo.secret).update(s).digest('base64url');

export function signToken(payload, ttlSec = 7 * 24 * 3600) {
  const body = b64(JSON.stringify({ ...payload, exp: Math.floor(Date.now() / 1000) + ttlSec }));
  return body + '.' + mac(body);
}

export function verifyToken(token) {
  if (typeof token !== 'string' || !token.includes('.')) return null;
  const [body, sig] = token.split('.');
  if (!safeEq(sig, mac(body))) return null;
  try {
    const p = JSON.parse(Buffer.from(body, 'base64url').toString());
    return p.exp > Date.now() / 1000 ? p : null;
  } catch { return null; }
}

/** Query string that authorises one method on one storage key until it expires. */
export function signKey(key, method = 'GET', ttlSec = 3600) {
  const exp = Math.floor(Date.now() / 1000) + ttlSec;
  return `exp=${exp}&sig=${mac(`${method}:${key}:${exp}`)}`;
}

export function verifyKey(key, method, exp, sig) {
  return +exp > Date.now() / 1000 && safeEq(String(sig || ''), mac(`${method}:${key}:${exp}`));
}

function safeEq(a, b) {
  const x = Buffer.from(String(a)), y = Buffer.from(String(b));
  return x.length === y.length && crypto.timingSafeEqual(x, y);
}
