"use client";

import { Command, Menu } from "lucide-react";
import { type ReactNode, useState } from "react";
import { Button, IconButton } from "@/components/ui/core";
import { Drawer, DrawerContent, DrawerTitle } from "@/components/ui/overlays";
import {
  Sidebar,
  SidebarFooter,
  SidebarHeader,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/shell";
import { usePersistentState } from "@/hooks/usePersistentState";
import { OPEN_CAPTURE_EVENT } from "../events";
import { SidebarNav } from "./SidebarNav";
import { ThemeMenu } from "./ThemeMenu";

export type AppShellProps = {
  /** Bas de sidebar (compte), rendu côté serveur. */
  account: ReactNode;
  children: ReactNode;
};

function Brand() {
  return <span className="truncate font-semibold text-neutral-12">MyDash</span>;
}

/**
 * Cadre applicatif : sidebar (repliable sur desktop, tiroir sur mobile),
 * barre supérieure, zone centrale. Le panneau détail est rendu par chaque
 * page (il dépend de ?item=).
 */
export function AppShell({ account, children }: AppShellProps) {
  const [collapsed, setCollapsed] = usePersistentState("mydash-sidebar-collapsed", false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <SidebarProvider collapsed={collapsed} onCollapsedChange={setCollapsed}>
      <div className="flex h-dvh overflow-hidden bg-neutral-1">
        <Sidebar className="hidden border-r border-neutral-6 md:flex">
          <SidebarHeader>
            <Brand />
          </SidebarHeader>
          <SidebarNav />
          <SidebarFooter className="border-t border-neutral-6 p-2">{account}</SidebarFooter>
        </Sidebar>

        {/* Mobile : même navigation dans un tiroir, toujours dépliée */}
        <Drawer open={mobileOpen} onOpenChange={setMobileOpen}>
          <DrawerContent side="left" className="w-72 p-0">
            <DrawerTitle className="sr-only">Navigation</DrawerTitle>
            <SidebarProvider collapsed={false}>
              <div className="flex h-full flex-col">
                <SidebarHeader>
                  <Brand />
                </SidebarHeader>
                <SidebarNav onNavigate={() => setMobileOpen(false)} />
                <SidebarFooter className="border-t border-neutral-6 p-2">{account}</SidebarFooter>
              </div>
            </SidebarProvider>
          </DrawerContent>
        </Drawer>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="flex h-14 shrink-0 items-center gap-2 border-b border-neutral-6 px-3">
            <IconButton
              variant="ghost"
              className="md:hidden"
              aria-label="Ouvrir la navigation"
              onClick={() => setMobileOpen(true)}
            >
              <Menu className="size-4" />
            </IconButton>
            <SidebarTrigger className="hidden md:inline-flex" aria-label="Replier la barre latérale" />

            <Button
              variant="outline"
              size="sm"
              className="ml-1 w-full max-w-md justify-start text-neutral-11"
              onClick={() => window.dispatchEvent(new Event(OPEN_CAPTURE_EVENT))}
            >
              Capturer ou rechercher…
              <kbd className="ml-auto hidden items-center gap-0.5 rounded border border-neutral-6 px-1.5 font-mono text-xs sm:inline-flex">
                <Command className="size-3" />K
              </kbd>
            </Button>

            <div className="ml-auto flex items-center gap-1">
              <ThemeMenu />
            </div>
          </header>

          <div className="flex min-h-0 flex-1">{children}</div>
        </div>
      </div>
    </SidebarProvider>
  );
}
