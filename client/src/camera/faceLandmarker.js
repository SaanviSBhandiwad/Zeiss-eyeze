// Loads MediaPipe's Face Landmarker once and shares it between tests.
// Everything runs in the browser: camera frames are never uploaded or saved.
//
// Files it needs, both served from this site (no third-party CDN, so it also works on a weak connection after the first load):
//   client/public/models/face_landmarker.task   the model (about 4 MB), committed to the repo
//   client/public/mediapipe/wasm/*              copied from node_modules by scripts/copy-mediapipe-wasm.mjs (git-ignored)
// The library itself is imported lazily, so it is only downloaded when a camera test opens.

const BASE = import.meta.env?.BASE_URL ?? '/';
export const MODEL_URL = `${BASE}models/face_landmarker.task`;
export const WASM_URL = `${BASE}mediapipe/wasm`;

/** code: 'model-missing' (404, or the server answered with a web page) | 'network' | 'init' (wasm or model failed to start) */
export class FaceModelError extends Error {
  constructor(code, message) { super(message); this.name = 'FaceModelError'; this.code = code; }
}

async function fetchModel() {
  let res;
  try { res = await fetch(MODEL_URL); } catch (e) { throw new FaceModelError('network', `Could not download ${MODEL_URL}: ${e.message}`); }
  if (!res.ok) throw new FaceModelError('model-missing', `${MODEL_URL} returned HTTP ${res.status}`);
  const buf = await res.arrayBuffer();
  // The Vite dev server and Render's SPA rewrite answer an unknown file with index.html and status 200, so check the content too.
  if (buf.byteLength < 1_000_000 || new Uint8Array(buf, 0, 1)[0] === 0x3c /* "<" */) {
    throw new FaceModelError('model-missing', `${MODEL_URL} is not a model file (${buf.byteLength} bytes). Commit face_landmarker.task to client/public/models/.`);
  }
  return buf;
}

async function create(delegate) {
  const [buf, vision] = await Promise.all([fetchModel(), import('@mediapipe/tasks-vision')]);
  try {
    const fileset = await vision.FilesetResolver.forVisionTasks(WASM_URL);
    return await vision.FaceLandmarker.createFromOptions(fileset, {
      baseOptions: { modelAssetBuffer: new Uint8Array(buf), delegate },
      runningMode: 'VIDEO',
      numFaces: 1,
      outputFaceBlendshapes: false,
      outputFacialTransformationMatrixes: false,
    });
  } catch (e) {
    throw new FaceModelError('init', `Face Landmarker failed to start (${delegate}): ${e.message || e}`);
  }
}

let preferCpu = false;
const cache = {};

/** Resolves to the shared FaceLandmarker. Tries the GPU first and falls back to the CPU if that fails to start. */
export function getFaceLandmarker() {
  const d = preferCpu ? 'CPU' : 'GPU';
  if (!cache[d]) {
    cache[d] = create(d).catch(e => {
      delete cache[d];
      if (d === 'GPU' && e.code === 'init') { preferCpu = true; return getFaceLandmarker(); }
      throw e;
    });
  }
  return cache[d];
}

/** Call when detection throws repeatedly on the GPU delegate: the next getFaceLandmarker() builds a CPU one. */
export function fallBackToCpu() { preferCpu = true; }
export const usingCpu = () => preferCpu;

let lastTs = 0;
/** MediaPipe's video mode needs strictly increasing timestamps across all callers. */
export function frameTimestamp() {
  lastTs = Math.max(lastTs + 1, Math.round(performance.now()));
  return lastTs;
}
