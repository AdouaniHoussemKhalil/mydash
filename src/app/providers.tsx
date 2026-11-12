"use client";

import type { ReactNode } from "react";
import { TooltipProvider } from "@/components/ui/core";
import { Toaster } from "@/components/ui/overlays";
import { ThemeProvider } from "@/components/ui/theme";
import { THEME_STORAGE_KEY } from "@/lib/constants";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider storageKey={THEME_STORAGE_KEY} defaultTheme="system">
      <TooltipProvider>
        {children}
        <Toaster />
      </TooltipProvider>
    </ThemeProvider>
  );
}
