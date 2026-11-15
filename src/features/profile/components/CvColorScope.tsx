"use client";

import { type ReactNode, useLayoutEffect, useRef } from "react";
import { applyColorOverrides, clearAllColorOverrides } from "@quickadui/theme";
import { cn } from "@quickadui/utils";

export type CvColorScopeProps = {
  /** Couleur de base (#RRGGBB) ; null = couleur de l'app. */
  color: string | null;
  className?: string | undefined;
  children: ReactNode;
};

const STEPS = Array.from({ length: 12 }, (_, index) => index + 1);

/**
 * Applique une couleur d'accent à cette zone seulement : QuickadUI génère
 * l'échelle complète (--qa-color-accent-1 à 12) sur l'élément. Les jetons
 * Tailwind --color-accent-* étant résolus à la racine, on les redéclare
 * sur l'élément pour qu'ils suivent cette échelle (fait ici plutôt qu'en
 * CSS : le compilateur retire une règle qui ne fait que les redéclarer).
 */
export function CvColorScope({ color, className, children }: CvColorScopeProps) {
  const ref = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const element = ref.current;
    if (!element) return;
    clearAllColorOverrides(element);
    for (const step of STEPS) element.style.removeProperty(`--color-accent-${step}`);
    if (!color) return;
    applyColorOverrides({ accent: color }, "light", element);
    for (const step of STEPS) {
      element.style.setProperty(`--color-accent-${step}`, `var(--qa-color-accent-${step})`);
    }
  }, [color]);

  return (
    <div ref={ref} className={cn("cv-accent-scope", className)}>
      {children}
    </div>
  );
}
