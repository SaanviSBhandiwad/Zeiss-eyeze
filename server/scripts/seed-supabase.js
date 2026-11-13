// Load the prototype's mock patients into Supabase so the portal queue isn't empty.
// Usage: npm run seed
import { admin } from '../services/supabase.js';
import { seedPatients, computeResult } from '../../client/src/shared/index.js';

if (!admin) { console.error('Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in server/.env first.'); process.exit(1); }

for (const s of seedPatients()) {
  const result = computeResult(s);
  const { data, error } = await admin.from('profiles').upsert({
    pid: s.pid, patient_id: null, name: s.name, age: s.age, gender: s.gender, village: s.village, phone: s.phone, lang: s.lang,
    answers: s.answers, tests: s.tests, voice_ans: {}, triage: result.tri, result, status: s.status, assisted: s.assisted,
    created_at: new Date(s.ts).toISOString(),
  }, { onConflict: 'pid' }).select('id').single();
  if (error) { console.error(s.name, error.message); continue; }
  if (s.reply) {
    await admin.from('replies').delete().eq('profile_id', data.id);
    await admin.from('replies').insert({
      profile_id: data.id, lens: s.reply.lens, coat: s.reply.coat, next_step: s.reply.next, centre: s.reply.centre,
      notes: s.reply.notes, notes_translated: s.reply.notes, created_at: new Date(s.reply.at).toISOString(),
    });
  }
  console.log('seeded', s.pid, s.name, result.tri);
}
