import { createClient } from '@supabase/supabase-js';
import { config, useSupabase } from '../config.js';

/** Service-role client. Bypasses RLS, so every route must check the caller itself. */
export const admin = useSupabase
  ? createClient(config.supabase.url, config.supabase.serviceKey, { auth: { persistSession: false, autoRefreshToken: false } })
  : null;
