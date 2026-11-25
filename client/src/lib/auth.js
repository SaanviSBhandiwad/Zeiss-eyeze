// Sign-in for both roles.
// Supabase mode: phone OTP (patients) and email + password (optometrists) through Supabase Auth.
// Demo mode: the Express server issues signed tokens and shows the OTP on screen.
// Patients and optometrists keep separate sessions so one browser can demo both.
import { createClient } from '@supabase/supabase-js';
import { api, getConfig } from './api.js';

// Patients stay signed in on their phone (localStorage) so they can check their reports later.
// Optometrists see patient records, so their session lasts only until the tab is closed (sessionStorage):
// reopening the portal always asks for email and password, which matters on shared clinic computers.
const store = role => {
  try { return role === 'optometrist' ? window.sessionStorage : window.localStorage; } catch { return undefined; }
};

const clients = {};
async function supa(role) {
  const cfg = await getConfig();
  if (!cfg.supabase) return null;
  clients[role] ||= createClient(cfg.supabase.url, cfg.supabase.anonKey, {
    auth: { storageKey: 'eyeze-' + role, storage: store(role), persistSession: true, autoRefreshToken: true },
  });
  return clients[role];
}
export const supabaseFor = supa;

const KEY = role => 'eyeze_demo_auth_' + role;
const readDemo = role => { try { return JSON.parse(store(role).getItem(KEY(role))); } catch { return null; } };
const writeDemo = (role, v) => { try { v ? store(role).setItem(KEY(role), JSON.stringify(v)) : store(role).removeItem(KEY(role)); } catch { /* private mode */ } };

// Old builds kept the optometrist session in localStorage forever; clear it so the portal asks to sign in.
try { localStorage.removeItem('eyeze-optometrist'); localStorage.removeItem(KEY('optometrist')); } catch { /* blocked */ }

/** Current access token for role, or null. Supabase refreshes it automatically. */
export async function getToken(role) {
  const s = await supa(role);
  if (s) return (await s.auth.getSession()).data.session?.access_token || null;
  return readDemo(role)?.token || null;
}

export async function getUser(role) {
  const s = await supa(role);
  if (s) {
    const u = (await s.auth.getSession()).data.session?.user;
    return u ? { id: u.id, phone: u.phone ? '+' + u.phone.replace(/^\+/, '') : null, email: u.email } : null;
  }
  return readDemo(role)?.user || null;
}

/** Returns { demoCode } in demo mode so the code can be shown on screen. */
export async function sendOtp(phone10) {
  const s = await supa('patient');
  if (s) {
    const { error } = await s.auth.signInWithOtp({ phone: '+91' + phone10 });
    if (error) throw error;
    return {};
  }
  return api('/auth/otp/send', { method: 'POST', body: { phone: phone10 } });
}

export async function verifyOtp(phone10, code) {
  const s = await supa('patient');
  if (s) {
    const { error } = await s.auth.verifyOtp({ phone: '+91' + phone10, token: code, type: 'sms' });
    if (error) throw error;
    return;
  }
  const r = await api('/auth/otp/verify', { method: 'POST', body: { phone: phone10, code } });
  writeDemo('patient', r);
}

export async function signInOptometrist(email, password) {
  const s = await supa('optometrist');
  if (s) {
    const { error } = await s.auth.signInWithPassword({ email, password });
    if (error) throw error;
  } else {
    writeDemo('optometrist', await api('/auth/login', { method: 'POST', body: { email, password } }));
  }
  // Make sure this account really is an optometrist.
  const me = await api('/auth/me', { token: await getToken('optometrist') });
  if (me.user.role !== 'optometrist') { await signOut('optometrist'); throw new Error('This account is not registered as an optometrist.'); }
  return me.user;
}

export async function signOut(role) {
  const s = await supa(role);
  if (s) await s.auth.signOut();
  writeDemo(role, null);
}
