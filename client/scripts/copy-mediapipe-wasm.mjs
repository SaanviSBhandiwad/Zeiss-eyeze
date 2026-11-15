// Copies MediaPipe's wasm runtime from node_modules into client/public/mediapipe/wasm so the app serves it itself
// (no third-party CDN). Runs automatically before `npm run dev` and `npm run build`. The output folder is git-ignored.
import { cpSync, existsSync, mkdirSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const from = join(root, 'node_modules', '@mediapipe', 'tasks-vision', 'wasm');
const to = join(root, 'public', 'mediapipe', 'wasm');

if (!existsSync(from)) {
  console.error('[mediapipe] node_modules/@mediapipe/tasks-vision/wasm not found. Run `npm install` in client/ first.');
  process.exit(1);
}
mkdirSync(to, { recursive: true });
cpSync(from, to, { recursive: true });
console.log('[mediapipe] wasm runtime copied to public/mediapipe/wasm');

// Not an error: the camera tests show a clear "could not load" message and offer to skip. But say so loudly.
const model = join(root, 'public', 'models', 'face_landmarker.task');
if (!existsSync(model) || statSync(model).size < 1_000_000) {
  console.warn('[mediapipe] WARNING: public/models/face_landmarker.task is missing, so the camera tests cannot run yet.');
  console.warn('            Download it once and commit it:');
  console.warn('            https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task');
}
