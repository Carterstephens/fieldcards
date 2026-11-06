const KEY = 'birdcards:v1';

export interface CardState {
  /** Leitner box, 1–5 */
  box: number;
  /** Epoch ms when the card is next due */
  due: number;
  reviews: number;
}

export interface Store {
  /** setId → speciesId → state */
  progress: Record<string, Record<string, CardState>>;
  /** Species ids the user marked "Confident": skipped in every set until restored. */
  confident: string[];
  prefs: { prompt: PromptMode; sessionSize: number };
}

export type PromptMode = 'photo' | 'sound' | 'mixed';

const empty = (): Store => ({ progress: {}, confident: [], prefs: { prompt: 'photo', sessionSize: 20 } });

export function setConfident(store: Store, ids: string[], confident: boolean): Store {
  const current = new Set(store.confident);
  for (const id of ids) confident ? current.add(id) : current.delete(id);
  return { ...store, confident: [...current] };
}

export function load(): Store {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return empty();
    const data = JSON.parse(raw) as Partial<Store>;
    return { ...empty(), ...data, prefs: { ...empty().prefs, ...data.prefs } };
  } catch {
    return empty();
  }
}

export function save(store: Store) {
  try {
    localStorage.setItem(KEY, JSON.stringify(store));
  } catch {
    // Storage unavailable (private mode, quota); progress just won't persist.
  }
}
