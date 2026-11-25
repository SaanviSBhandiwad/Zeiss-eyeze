// Data access. Two implementations with the same interface:
//  - Supabase (Postgres) when SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY are set
//  - in-memory with the prototype's mock patients otherwise ("demo mode")
import crypto from 'node:crypto';
import { EventEmitter } from 'node:events';
import { useSupabase } from '../config.js';
import { admin } from './supabase.js';
import { seedPatients } from '../../client/src/shared/index.js';

/** Fires { profileId, patientId } whenever a profile or its reply changes (used for demo-mode live updates). */
export const changes = new EventEmitter();
changes.setMaxListeners(500);
const emit = p => changes.emit('change', { profileId: p.id, patientId: p.patientId || null });

/* ------------------------------------------------------------------ */
/* Supabase                                                            */
/* ------------------------------------------------------------------ */
const toReply = r => r && ({
  id: r.id, lens: r.lens, coat: r.coat || [], next: r.next_step, centre: r.centre,
  notes: r.notes || '', notesTranslated: r.notes_translated || '', text: r.message || '',
  audioKey: r.audio_key || null, at: Date.parse(r.created_at),
});

const toInvite = c => c && ({
  id: c.id, startsAt: Date.parse(c.starts_at), durationMin: c.duration_min, meetLink: c.meet_link, at: Date.parse(c.created_at),
});

function toProfile(row) {
  const live = (row.replies || []).filter(r => !r.retracted_at).sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at));
  const calls = (row.consultations || []).sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at));
  return {
    id: row.id, pid: row.pid, patientId: row.patient_id, name: row.name, age: row.age, gender: row.gender || '',
    village: row.village || '', phone: row.phone || '', lang: row.lang, answers: row.answers || {}, tests: row.tests || {},
    voiceAns: row.voice_ans || {}, noteEn: row.note_en || '', triage: row.triage, status: row.status,
    assisted: row.assisted, ts: Date.parse(row.created_at), live: true,
    reply: row.status === 'replied' ? toReply(live[0]) : null, invite: toInvite(calls[0]) || null,
  };
}

const must = ({ data, error }) => { if (error) throw new Error(error.message); return data; };
const SEL = '*, replies(*), consultations(*)';

const supa = {
  async upsertPatient(p) {
    must(await admin.from('patients').upsert({ id: p.id, name: p.name, village: p.village, phone: p.phone, lang: p.lang }));
  },
  async createProfile(p) {
    const row = must(await admin.from('profiles').insert({
      pid: p.pid, patient_id: p.patientId, name: p.name, age: p.age, gender: p.gender, village: p.village, phone: p.phone,
      lang: p.lang, answers: p.answers, tests: p.tests, voice_ans: p.voiceAns, note_en: p.noteEn, triage: p.triage,
      result: p.result, status: 'new', assisted: p.assisted,
    }).select(SEL).single());
    return toProfile(row);
  },
  async listProfiles() {
    return must(await admin.from('profiles').select(SEL).order('created_at', { ascending: false }).limit(500)).map(toProfile);
  },
  async listByPatient(patientId) {
    return must(await admin.from('profiles').select(SEL).eq('patient_id', patientId).order('created_at', { ascending: false })).map(toProfile);
  },
  async getProfile(id) {
    if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
    const row = must(await admin.from('profiles').select(SEL).eq('id', id).maybeSingle());
    return row ? toProfile(row) : null;
  },
  async setStatus(id, status) {
    must(await admin.from('profiles').update({ status, updated_at: new Date().toISOString() }).eq('id', id));
  },
  async addReply(id, r, optometristId) {
    must(await admin.from('replies').insert({
      profile_id: id, optometrist_id: optometristId, lens: r.lens, coat: r.coat, next_step: r.next, centre: r.centre,
      notes: r.notes, notes_translated: r.notesTranslated, message: r.text, audio_key: r.audioKey,
    }));
    await supa.setStatus(id, 'replied');
  },
  async clearReply(id) {
    must(await admin.from('replies').update({ retracted_at: new Date().toISOString() }).eq('profile_id', id).is('retracted_at', null));
    await supa.setStatus(id, 'review');
  },

  /* Google Meet: the doctor's Google connection and booked calls. */
  async getGoogle(optometristId) {
    return must(await admin.from('google_tokens').select('refresh_token').eq('optometrist_id', optometristId).maybeSingle())?.refresh_token || null;
  },
  async saveGoogle(optometristId, refreshToken) {
    must(await admin.from('google_tokens').upsert({ optometrist_id: optometristId, refresh_token: refreshToken, updated_at: new Date().toISOString() }));
  },
  async deleteGoogle(optometristId) {
    must(await admin.from('google_tokens').delete().eq('optometrist_id', optometristId));
  },
  async addConsultation(c) {
    must(await admin.from('consultations').insert({
      profile_id: c.profileId, optometrist_id: c.optometristId, starts_at: new Date(c.startsAt).toISOString(),
      duration_min: c.durationMin, meet_link: c.meetLink, calendar_event_id: c.eventId,
    }));
    // Touch the profile so the portal's realtime listener refetches as well.
    must(await admin.from('profiles').update({ updated_at: new Date().toISOString() }).eq('id', c.profileId));
  },
};

/* ------------------------------------------------------------------ */
/* In-memory demo store                                                */
/* ------------------------------------------------------------------ */
const mem = new Map();
const patients = new Map();
const googleTokens = new Map(); // optometristId -> refresh token (demo mode only, lost on restart)
function resetMemory() {
  mem.clear();
  for (const s of seedPatients()) mem.set(s.id, { ...s, patientId: null, voiceAns: {}, noteEn: '', live: false });
}
resetMemory();
const clone = o => structuredClone(o);

const memory = {
  async upsertPatient(p) { patients.set(p.id, { ...patients.get(p.id), ...p }); },
  async createProfile(p) {
    const rec = { ...p, id: crypto.randomUUID(), status: 'new', ts: Date.now(), reply: null, invite: null, live: true };
    mem.set(rec.id, rec);
    emit(rec);
    return clone(rec);
  },
  async listProfiles() { return [...mem.values()].map(clone); },
  async listByPatient(patientId) { return [...mem.values()].filter(p => p.patientId === patientId).sort((a, b) => b.ts - a.ts).map(clone); },
  async getProfile(id) { const p = mem.get(id); return p ? clone(p) : null; },
  async setStatus(id, status) { const p = mem.get(id); if (p) { p.status = status; emit(p); } },
  async addReply(id, r) { const p = mem.get(id); if (p) { p.reply = { ...r, id: crypto.randomUUID(), at: Date.now() }; p.status = 'replied'; emit(p); } },
  async clearReply(id) { const p = mem.get(id); if (p) { p.reply = null; p.status = 'review'; emit(p); } },
  async getGoogle(id) { return googleTokens.get(id) || null; },
  async saveGoogle(id, token) { googleTokens.set(id, token); },
  async deleteGoogle(id) { googleTokens.delete(id); },
  async addConsultation(c) {
    const p = mem.get(c.profileId);
    if (p) { p.invite = { id: crypto.randomUUID(), startsAt: +new Date(c.startsAt), durationMin: c.durationMin, meetLink: c.meetLink, at: Date.now() }; emit(p); }
  },
  async reset() { resetMemory(); changes.emit('change', { profileId: null, patientId: null }); },
};

export const store = useSupabase ? supa : memory;
