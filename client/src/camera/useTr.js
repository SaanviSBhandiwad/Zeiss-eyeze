// Translation helper for the camera tests: re-renders when the patient changes language.
//   const tr = useTr();  tr('npTitle')  tr('npResult', { cm: 30 })
import { t } from '../shared/index.js';
import { app } from '../patient/state.js';
import { useStore } from '../lib/store.js';

export function useTr() {
  const lang = useStore(app, s => s.lang);
  return (k, vars) => t(k, lang, vars);
}
