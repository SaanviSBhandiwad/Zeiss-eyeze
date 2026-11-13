// Audio storage. Amazon S3 (Mumbai, ap-south-1) when S3_BUCKET is set, otherwise a local folder
// (demo mode only: Render's disk is wiped on every deploy).
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { S3Client, PutObjectCommand, HeadObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { createPresignedPost } from '@aws-sdk/s3-presigned-post';
import { config, useS3 } from '../config.js';
import { signKey } from './sign.js';

const MAX_UPLOAD = 3 * 1024 * 1024;
const LOCAL_DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '.storage');

const s3 = useS3 ? new S3Client({
  region: config.aws.region,
  ...(config.aws.accessKeyId ? { credentials: { accessKeyId: config.aws.accessKeyId, secretAccessKey: config.aws.secretAccessKey } } : {}),
}) : null;
const Bucket = config.aws.bucket;

export const storageMode = useS3 ? 's3' : 'local';

export function safeKey(key) {
  return typeof key === 'string' && /^[a-zA-Z0-9][a-zA-Z0-9/_.-]{0,200}$/.test(key) && !key.includes('..');
}
const localPath = key => path.join(LOCAL_DIR, ...key.split('/'));
const localUrl = (key, method, ttl) => `/api/voice/local/${key}?${signKey(key, method, ttl)}`;

export async function putObject(key, body, contentType) {
  if (s3) return s3.send(new PutObjectCommand({ Bucket, Key: key, Body: body, ContentType: contentType }));
  await fs.mkdir(path.dirname(localPath(key)), { recursive: true });
  await fs.writeFile(localPath(key), body);
}

export async function exists(key) {
  try {
    if (s3) { await s3.send(new HeadObjectCommand({ Bucket, Key: key })); return true; }
    await fs.access(localPath(key)); return true;
  } catch { return false; }
}

/** Short-lived URL the browser can GET. */
export async function readUrl(key, ttl = 3600) {
  if (s3) return getSignedUrl(s3, new GetObjectCommand({ Bucket, Key: key }), { expiresIn: ttl });
  return localUrl(key, 'GET', ttl);
}

/** Where the browser should upload a file directly (never through this server when S3 is on). */
export async function uploadTarget(key, contentType) {
  if (s3) {
    const { url, fields } = await createPresignedPost(s3, {
      Bucket, Key: key, Expires: 300,
      Fields: { 'Content-Type': contentType },
      Conditions: [['content-length-range', 1, MAX_UPLOAD], ['eq', '$Content-Type', contentType]],
    });
    return { method: 'POST', url, fields, key };
  }
  return { method: 'PUT', url: localUrl(key, 'PUT', 300), key };
}

/* local-mode helpers for routes/voice.js */
export const local = {
  maxUpload: MAX_UPLOAD,
  read: key => fs.readFile(localPath(key)),
  write: (key, buf) => putObject(key, buf),
};
