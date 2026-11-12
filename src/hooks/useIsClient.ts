"use client";

import { useSyncExternalStore } from "react";

const subscribe = () => () => {};

/**
 * false pendant le rendu serveur et l'hydratation, true ensuite. Pour tout
 * rendu qui dépend d'un état navigateur (localStorage, matchMedia…).
 */
export function useIsClient(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
}
