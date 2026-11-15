// Front-camera stream for a <video> element.
//   const cam = useCamera();            // starts on mount, stops on unmount
//   <CameraView cam={cam} />            // renders cam.videoRef
// cam.status: 'idle' | 'starting' | 'live' | 'error'
// cam.error:  'denied' | 'nocamera' | 'busy' | 'insecure' | 'unsupported' | 'failed' | null
// cam.size:   { w, h } of the real video frame once known. Use this, never the element's CSS size, for pixel maths.
import { useCallback, useEffect, useRef, useState } from 'react';

// Asking for 1280x720 matters: the iris is only about 12 mm wide, so a 480 px wide frame would give a coarse scale.
// The browser may still give something else, so everything downstream uses the real frame size.
const ATTEMPTS = [
  { video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } }, audio: false },
  { video: { facingMode: 'user' }, audio: false },
  { video: true, audio: false },
];

export function cameraSupport() {
  if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
    // getUserMedia only exists on https (or localhost). A phone opening http://192.168.x.x:5173 lands here.
    return typeof window !== 'undefined' && window.isSecureContext === false ? 'insecure' : 'unsupported';
  }
  return 'ok';
}

function errorCode(e) {
  switch (e?.name) {
    case 'NotAllowedError': case 'SecurityError': case 'PermissionDeniedError': return 'denied';
    case 'NotFoundError': case 'DevicesNotFoundError': return 'nocamera';
    case 'NotReadableError': case 'TrackStartError': case 'AbortError': return 'busy';
    default: return 'failed';
  }
}

export function useCamera({ autoStart = true } = {}) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const gen = useRef(0); // bumped on every start/stop, so a stream that arrives late (after unmount or a restart) is discarded
  const [state, setState] = useState({ status: 'idle', error: null, size: null });

  const stop = useCallback(() => {
    gen.current++;
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
    const v = videoRef.current;
    if (v) { try { v.pause(); } catch { /* ignore */ } v.srcObject = null; }
  }, []);

  const start = useCallback(async () => {
    stop();
    const mine = gen.current;
    const support = cameraSupport();
    if (support !== 'ok') { setState({ status: 'error', error: support, size: null }); return; }
    setState({ status: 'starting', error: null, size: null });

    let stream = null, lastErr = null;
    for (const constraints of ATTEMPTS) {
      try { stream = await navigator.mediaDevices.getUserMedia(constraints); break; } catch (e) {
        lastErr = e;
        const code = errorCode(e);
        if (code === 'denied' || code === 'busy' || mine !== gen.current) break; // retrying with looser constraints cannot help
      }
    }
    if (mine !== gen.current) { stream?.getTracks().forEach(t => t.stop()); return; }
    if (!stream) { setState({ status: 'error', error: errorCode(lastErr), size: null }); return; }

    const v = videoRef.current;
    if (!v) { stream.getTracks().forEach(t => t.stop()); return; }
    streamRef.current = stream;
    stream.getVideoTracks()[0]?.addEventListener('ended', () => {
      if (mine === gen.current) setState({ status: 'error', error: 'failed', size: null });
    });
    v.srcObject = stream;
    try { await v.play(); } catch { /* an interrupted play() is fine if a newer start() took over; checked below */ }
    if (mine !== gen.current) return;

    // Wait (briefly) until the real frame size is known.
    for (let i = 0; i < 50 && !v.videoWidth && mine === gen.current; i++) await new Promise(r => setTimeout(r, 100));
    if (mine !== gen.current) return;
    if (!v.videoWidth) { stop(); setState({ status: 'error', error: 'failed', size: null }); return; }
    setState({ status: 'live', error: null, size: { w: v.videoWidth, h: v.videoHeight } });
  }, [stop]);

  // Keep size in step with the real video (a phone turned sideways changes it).
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return undefined;
    const sync = () => {
      if (!v.videoWidth) return;
      setState(s => (s.status === 'live' && (s.size?.w !== v.videoWidth || s.size?.h !== v.videoHeight)
        ? { ...s, size: { w: v.videoWidth, h: v.videoHeight } } : s));
    };
    v.addEventListener('resize', sync);
    return () => v.removeEventListener('resize', sync);
  }, []);

  // Phones switch the camera off when the page is hidden. Bring it back when the person returns.
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState !== 'visible' || !streamRef.current) return;
      const track = streamRef.current.getVideoTracks()[0];
      if (!track || track.readyState === 'ended') start();
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [start]);

  useEffect(() => {
    if (autoStart) start();
    return stop;
  }, [autoStart, start, stop]);

  return { videoRef, status: state.status, error: state.error, size: state.size, start, stop };
}
