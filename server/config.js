import 'dotenv/config';
import crypto from 'node:crypto';

const env = process.env;

export const config = {
  port: +env.PORT || 4000,
  /** Comma-separated list of allowed browser origins (the Render static site URL). */
  clientOrigins: (env.CLIENT_ORIGIN || 'http://localhost:5173').split(',').map(s => s.trim()).filter(Boolean),
  /** Public URL of this server, used to build links to locally stored audio. */
  publicUrl: (env.PUBLIC_URL || '').replace(/\/$/, ''),

  supabase: {
    url: env.SUPABASE_URL || '',
    // Accepts Supabase's new key names (publishable / secret) or the legacy ones (anon / service_role).
    anonKey: env.SUPABASE_PUBLISHABLE_KEY || env.SUPABASE_ANON_KEY || '',
    serviceKey: env.SUPABASE_SECRET_KEY || env.SUPABASE_SERVICE_ROLE_KEY || '',
  },

  sarvam: {
    key: env.SARVAM_API_KEY || '',
    base: env.SARVAM_BASE_URL || 'https://api.sarvam.ai',
    sttModel: env.SARVAM_STT_MODEL || 'saaras:v3',
    ttsModel: env.SARVAM_TTS_MODEL || 'bulbul:v3',
    ttsSpeaker: env.SARVAM_TTS_SPEAKER || 'ishita',
    ttsPace: +env.SARVAM_TTS_PACE || 0.95,
    translateModel: env.SARVAM_TRANSLATE_MODEL || 'mayura:v1',
  },

  aws: {
    region: env.AWS_REGION || 'ap-south-1',
    bucket: env.S3_BUCKET || '',
    accessKeyId: env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: env.AWS_SECRET_ACCESS_KEY || '',
  },

  demo: {
    /** Signs demo-mode tokens and local audio URLs. Random per boot if unset. */
    secret: env.DEMO_SECRET || crypto.randomBytes(32).toString('hex'),
    optometristEmail: env.DEMO_OPTOMETRIST_EMAIL || 'anjali.rao@eyeze.in',
    optometristPassword: env.DEMO_OPTOMETRIST_PASSWORD || 'demo-password',
  },
};

export const useSupabase = !!(config.supabase.url && config.supabase.serviceKey);
export const useSarvam = !!config.sarvam.key;
export const useS3 = !!config.aws.bucket;
export const mode = useSupabase ? 'supabase' : 'demo';
