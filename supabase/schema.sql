-- Eyeze schema. Run in the Supabase SQL editor (or `supabase db push`).
-- Create the project in the Mumbai region (ap-south-1): health data is sensitive personal data under the DPDP Act.

create extension if not exists pgcrypto;

-- Optometrists: one row per Supabase Auth user who may use the portal.
create table if not exists public.optometrists (
  id uuid primary key references auth.users (id) on delete cascade,
  name text not null,
  qualification text,
  hub text,
  created_at timestamptz not null default now()
);

-- Patients: Supabase Auth users who signed in with phone OTP.
create table if not exists public.patients (
  id uuid primary key references auth.users (id) on delete cascade,
  name text,
  village text,
  phone text,
  lang text not null default 'en' check (lang in ('en', 'hi', 'kn')),
  created_at timestamptz not null default now()
);

-- One submitted report: interview answers, phone test results, triage.
create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  pid text unique,                                      -- human-readable ID, e.g. EZ-261113-4821
  patient_id uuid references public.patients (id) on delete cascade, -- null for seeded/demo rows
  name text not null,
  age int,
  gender text,
  village text,
  phone text,
  lang text not null default 'en' check (lang in ('en', 'hi', 'kn')),
  answers jsonb not null default '{}',
  tests jsonb not null default '{}',
  voice_ans jsonb not null default '{}',               -- { questionId: { text, en, clip } }, clip = S3 key
  note_en text,                                         -- free-text note translated to English
  triage text check (triage in ('green', 'amber', 'red')),
  result jsonb,                                         -- computeResult() output at submission time
  status text not null default 'new' check (status in ('new', 'review', 'replied')),
  assisted text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists profiles_patient_idx on public.profiles (patient_id, created_at desc);
create index if not exists profiles_queue_idx on public.profiles (status, triage, created_at desc);

-- Optometrist replies. "Edit and resend" retracts the old row instead of deleting it.
create table if not exists public.replies (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles (id) on delete cascade,
  optometrist_id uuid references public.optometrists (id) on delete set null,
  lens text not null,
  coat text[] not null default '{}',
  next_step text not null,
  centre text not null,
  notes text,                                           -- as typed (English)
  notes_translated text,                                -- in the patient's language
  message text,                                         -- full text the patient hears and reads
  audio_key text,                                       -- S3 key of the Sarvam TTS voice message
  retracted_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists replies_profile_idx on public.replies (profile_id, created_at desc);

-- Video consultations (used from phase 3, Google Meet).
create table if not exists public.consultations (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles (id) on delete cascade,
  optometrist_id uuid references public.optometrists (id) on delete set null,
  starts_at timestamptz not null,
  duration_min int not null default 15,
  meet_link text,
  calendar_event_id text,
  guest_email text,
  created_at timestamptz not null default now()
);

-- Google connection per optometrist (phase 3, Google Meet). Server only: RLS on, no policies,
-- so the browser can never read the refresh token.
create table if not exists public.google_tokens (
  optometrist_id uuid primary key references public.optometrists (id) on delete cascade,
  refresh_token text not null,
  updated_at timestamptz not null default now()
);
alter table public.google_tokens enable row level security;
create index if not exists consultations_profile_idx on public.consultations (profile_id, created_at desc);

-- ---------------------------------------------------------------------------
-- Row-level security
-- The Express server uses the service-role key (bypasses RLS) and checks roles itself.
-- These policies protect direct browser access and Supabase Realtime.
-- ---------------------------------------------------------------------------
create or replace function public.is_optometrist() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.optometrists where id = auth.uid());
$$;

alter table public.optometrists  enable row level security;
alter table public.patients      enable row level security;
alter table public.profiles      enable row level security;
alter table public.replies       enable row level security;
alter table public.consultations enable row level security;

drop policy if exists "optometrists read self" on public.optometrists;
create policy "optometrists read self" on public.optometrists for select using (id = auth.uid());

drop policy if exists "patients own row" on public.patients;
create policy "patients own row" on public.patients for all using (id = auth.uid()) with check (id = auth.uid());
drop policy if exists "optometrists read patients" on public.patients;
create policy "optometrists read patients" on public.patients for select using (public.is_optometrist());

drop policy if exists "patients read own profiles" on public.profiles;
create policy "patients read own profiles" on public.profiles for select using (patient_id = auth.uid());
drop policy if exists "patients insert own profiles" on public.profiles;
create policy "patients insert own profiles" on public.profiles for insert with check (patient_id = auth.uid());
drop policy if exists "optometrists read profiles" on public.profiles;
create policy "optometrists read profiles" on public.profiles for select using (public.is_optometrist());
drop policy if exists "optometrists update profiles" on public.profiles;
create policy "optometrists update profiles" on public.profiles for update using (public.is_optometrist());

drop policy if exists "patients read own replies" on public.replies;
create policy "patients read own replies" on public.replies for select
  using (exists (select 1 from public.profiles p where p.id = profile_id and p.patient_id = auth.uid()));
drop policy if exists "optometrists manage replies" on public.replies;
create policy "optometrists manage replies" on public.replies for all using (public.is_optometrist()) with check (public.is_optometrist());

drop policy if exists "patients read own consultations" on public.consultations;
create policy "patients read own consultations" on public.consultations for select
  using (exists (select 1 from public.profiles p where p.id = profile_id and p.patient_id = auth.uid()));
drop policy if exists "optometrists manage consultations" on public.consultations;
create policy "optometrists manage consultations" on public.consultations for all using (public.is_optometrist()) with check (public.is_optometrist());

-- ---------------------------------------------------------------------------
-- Realtime: new reports reach the portal, status changes and replies reach the patient.
-- Realtime respects the RLS policies above.
-- ---------------------------------------------------------------------------
do $$
begin
  begin alter publication supabase_realtime add table public.profiles;      exception when duplicate_object then null; end;
  begin alter publication supabase_realtime add table public.replies;       exception when duplicate_object then null; end;
  begin alter publication supabase_realtime add table public.consultations; exception when duplicate_object then null; end;
end $$;
