"use client";

import { LogOut } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/core";
import { useSidebar } from "@/components/ui/shell";

export type AccountMenuProps = {
  email: string | null;
  signOutAction: () => Promise<void>;
};

export function AccountMenu({ email, signOutAction }: AccountMenuProps) {
  const { collapsed } = useSidebar();
  const label = email ?? "Mon compte";
  const initial = label.charAt(0).toUpperCase();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="flex w-full items-center gap-3 rounded-md px-2 py-2 text-left text-sm hover:bg-neutral-3 focus-visible:outline-2 focus-visible:outline-accent-8"
          aria-label={`Compte : ${label}`}
        >
          <span
            aria-hidden
            className="flex size-7 shrink-0 items-center justify-center rounded-full bg-accent-3 text-xs font-semibold text-accent-11"
          >
            {initial}
          </span>
          {!collapsed && <span className="truncate text-neutral-12">{label}</span>}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" side="top" className="w-56">
        <DropdownMenuLabel className="truncate">{label}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <form action={signOutAction}>
          <DropdownMenuItem asChild>
            <button type="submit" className="w-full">
              <LogOut className="size-4" />
              Se déconnecter
            </button>
          </DropdownMenuItem>
        </form>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
