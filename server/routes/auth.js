// Demo-mode sign in. In Supabase mode the browser talks to Supabase Auth directly
// (phone OTP for patients, email + password for optometrists) and these routes are disabled.
import { Router } from 'express';
import crypto from 'node:crypto';
import rateLimit from 'express-rate-limit';
import { config, useSupabase } from '../config.js';
import { signToken } from '../services/sign.js';
import { requireAuth } from '../services/auth.js';

export const authRouter = Router();
const otps = new Map(); // phone -> { code, until, tries }

authRouter.use(rateLimit({ windowMs: 60_000, limit: 20, standardHeaders: true, legacyHeaders: false }));
authRouter.use((req, res, next) => {
  if (useSupabase && req.path !== '/me') return res.status(404).json({ error: 'Use Supabase Auth' });
  next();
});

const cleanPhone = p => String(p || '').replace(/\D/g, '').replace(/^91(?=\d{10}$)/, '');

authRouter.post('/otp/send', (req, res) => {
  const phone = cleanPhone(req.body?.phone);
  if (phone.length !== 10) return res.status(400).json({ error: 'Enter a 10-digit number' });
  const code = String(crypto.randomInt(100000, 1000000));
  otps.set(phone, { code, until: Date.now() + 5 * 60_000, tries: 0 });
  // Demo mode has no SMS provider, so the code is returned and shown on screen.
  res.json({ ok: true, demoCode: code });
});

authRouter.post('/otp/verify', (req, res) => {
  const phone = cleanPhone(req.body?.phone), o = otps.get(phone);
  if (!o || o.until < Date.now() || o.tries >= 5) return res.status(400).json({ error: 'Code expired' });
  if (String(req.body?.code) !== o.code) { o.tries++; return res.status(400).json({ error: 'Wrong code' }); }
  otps.delete(phone);
  const user = { sub: 'demo-patient-' + phone, role: 'patient', phone: '+91' + phone };
  res.json({ token: signToken(user), user: { id: user.sub, role: 'patient', phone: user.phone } });
});

authRouter.post('/login', (req, res) => {
  const { email, password } = req.body || {};
  if (String(email).toLowerCase() !== config.demo.optometristEmail || password !== config.demo.optometristPassword)
    return res.status(401).json({ error: 'Wrong email or password' });
  const user = { sub: 'demo-optometrist', role: 'optometrist', email: config.demo.optometristEmail, name: 'Dr. Anjali Rao' };
  res.json({ token: signToken(user, 12 * 3600), user: { id: user.sub, role: user.role, email: user.email, name: user.name } });
});

authRouter.get('/me', requireAuth(), (req, res) => res.json({ user: req.user }));
