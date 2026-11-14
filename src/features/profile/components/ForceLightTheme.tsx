"use client";

import { useEffect } from "react";

/**
 * Le CV est un document imprimable : toujours en clair, quel que soit le
 * thème de l'app. Les jetons QuickadUI ne basculent qu'à la racine
 * (:root[data-theme]) : on y force « light » tant que la page est ouverte,
 * puis on rétablit le réglage précédent.
 */
export function ForceLightTheme() {
  useEffect(() => {
    const root = document.documentElement;
    const previous = root.getAttribute("data-theme");
    root.setAttribute("data-theme", "light");
    return () => {
      if (previous === null) root.removeAttribute("data-theme");
      else root.setAttribute("data-theme", previous);
    };
  }, []);
  return null;
}
