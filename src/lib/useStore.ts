import { useCallback, useState } from 'react';
import { load, save, type Store } from './storage.ts';

export function useStore() {
  const [store, setStore] = useState<Store>(load);
  const update = useCallback((fn: (s: Store) => Store) => {
    setStore((prev) => {
      const next = fn(prev);
      save(next);
      return next;
    });
  }, []);
  return [store, update] as const;
}
