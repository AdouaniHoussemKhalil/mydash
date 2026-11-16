"use client";

import { LayoutGrid, List, type LucideIcon, Table2 } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/core";
import { cn } from "@quickadui/utils";
import { VIEW_LABELS, VIEW_MODES, type ViewMode, withSearchParams } from "../views";

const ICONS: Record<ViewMode, LucideIcon> = { list: List, cards: LayoutGrid, table: Table2 };

export function ViewSwitcher({ value }: { value: ViewMode }) {
  const router = useRouter();
  const pathname = usePathname();

  const select = (view: ViewMode) => {
    router.replace(`${pathname}${withSearchParams(window.location.search, { view })}`, {
      scroll: false,
    });
  };

  return (
    <div role="group" aria-label="Affichage" className="inline-flex rounded-md border border-neutral-6 p-0.5">
      {VIEW_MODES.map((view) => {
        const Icon = ICONS[view];
        const selected = view === value;
        return (
          <Tooltip key={view}>
            <TooltipTrigger asChild>
              <button
                type="button"
                aria-pressed={selected}
                aria-label={VIEW_LABELS[view]}
                onClick={() => select(view)}
                className={cn(
                  "flex size-7 items-center justify-center rounded text-neutral-11 transition-colors hover:bg-neutral-3 hover:text-neutral-12",
                  selected && "bg-neutral-4 text-neutral-12",
                )}
              >
                <Icon className="size-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent>{VIEW_LABELS[view]}</TooltipContent>
          </Tooltip>
        );
      })}
    </div>
  );
}
