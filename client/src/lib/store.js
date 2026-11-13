// Tiny external store: actions read and write state outside React (timers, async voice
// callbacks) without stale closures; components subscribe with useStore.
import { useSyncExternalStore } from 'react';

export function createStore(initial) {
  let state = initial;
  const subs = new Set();
  return {
    get: () => state,
    set(patch) {
      state = { ...state, ...(typeof patch === 'function' ? patch(state) : patch) };
      subs.forEach(f => f());
    },
    subscribe(f) { subs.add(f); return () => subs.delete(f); },
  };
}

export function useStore(store, select = s => s) {
  return useSyncExternalStore(store.subscribe, () => select(store.get()));
}
