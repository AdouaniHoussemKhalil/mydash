"use client";

import { X } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { type ReactNode, useCallback, useEffect } from "react";
import { IconButton } from "@/components/ui/core";
import { withSearchParams } from "../views";

export type DetailPanelProps = {
  title: string;
  children: ReactNode;
};

/**
 * Panneau détail à droite, piloté par ?item=. Desktop : colonne fixe ;
 * mobile : plein écran. Échap ou la croix retirent le paramètre.
 */
export function DetailPanel({ title, children }: DetailPanelProps) {
  const router = useRouter();
  const pathname = usePathname();

  const close = useCallback(() => {
    router.replace(`${pathname}${withSearchParams(window.location.search, { item: null })}`, {
      scroll: false,
    });
  }, [router, pathname]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      // Une modale ou un menu ouvert gère Échap lui-même.
      if (event.key !== "Escape" || event.defaultPrevented) return;
      if (document.querySelector("[role=dialog][data-state=open], [role=menu]")) return;
      // En cours d'édition : Échap quitte d'abord le champ (qui s'enregistre au blur).
      const active = document.activeElement;
      if (active instanceof HTMLElement && active.matches("input, textarea, [contenteditable=true]")) {
        active.blur();
        return;
      }
      close();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [close]);

  return (
    <aside
      aria-label={`Détail : ${title}`}
      className="fixed inset-0 z-30 flex flex-col bg-neutral-1 md:static md:z-auto md:w-[26rem] md:shrink-0 md:border-l md:border-neutral-6 lg:w-[30rem]"
    >
      <div className="flex h-12 shrink-0 items-center gap-2 border-b border-neutral-6 px-3">
        <h2 className="min-w-0 flex-1 truncate text-sm font-medium text-neutral-12">{title}</h2>
        <IconButton variant="ghost" size="sm" aria-label="Fermer le détail (Échap)" onClick={close}>
          <X className="size-4" />
        </IconButton>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto p-4">{children}</div>
    </aside>
  );
}
