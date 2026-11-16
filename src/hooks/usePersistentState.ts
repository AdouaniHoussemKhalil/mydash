"use client";

import { useCallback, useEffect, useState } from "react";

/**
 * useState persisté dans localStorage (préférences d'interface uniquement).
 * Lecture après le montage pour éviter tout écart d'hydratation ; toute
 * erreur de stockage (navigation privée…) est ignorée.
 */
export function usePersistentState<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(initial);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(key);
      // eslint-disable-next-line react-hooks/set-state-in-effect -- synchronisation unique depuis le stockage
      if (stored !== null) setValue(JSON.parse(stored) as T);
    } catch {
      /* stockage indisponible */
    }
  }, [key]);

  const update = useCallback(
    (next: T) => {
      setValue(next);
      try {
        window.localStorage.setItem(key, JSON.stringify(next));
      } catch {
        /* stockage indisponible */
      }
    },
    [key],
  );

  return [value, update] as const;
}
