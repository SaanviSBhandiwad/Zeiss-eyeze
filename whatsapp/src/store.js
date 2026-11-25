// Tiny JSON-file store so sessions survive a server restart. Swap for Redis/Postgres/Firestore later.
const fs = require('fs'), path = require('path');
const DIR = path.join(__dirname, '..', 'data');
const SESS = path.join(DIR, 'sessions.json'), PROF = path.join(DIR, 'profiles.json');
const read = f => { try { return JSON.parse(fs.readFileSync(f, 'utf8')); } catch { return {}; } };
const write = (f, o) => { fs.mkdirSync(DIR, { recursive: true }); fs.writeFileSync(f, JSON.stringify(o, null, 2)); };

module.exports = {
  getSession: phone => read(SESS)[phone] || null,
  saveSession: (phone, s) => { const all = read(SESS); all[phone] = s; write(SESS, all); },
  // Completed profiles = what the remote optometrist portal reads.
  saveProfile: (phone, s) => {
    const all = read(PROF);
    all[phone] = { phone, name: s.name, age: s.age, lang: ['en', 'hi', 'kn'][s.lang], answers: s.answers, result: s.result, finishedAt: s.finishedAt, status: 'new', reply: null };
    write(PROF, all);
  },
  allProfiles: () => Object.values(read(PROF)).sort((a, b) => (b.finishedAt || '').localeCompare(a.finishedAt || '')),
  getProfile: phone => read(PROF)[phone] || null,
  setEyezeId: (phone, id) => { const all = read(PROF); if (all[phone]) { all[phone].eyezeId = id; write(PROF, all); } },
  setReply: (phone, reply) => { const all = read(PROF); if (!all[phone]) return null; all[phone].reply = reply; all[phone].status = 'replied'; write(PROF, all); return all[phone]; },
};
