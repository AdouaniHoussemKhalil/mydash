"use client";

// QuickadUI n'embarque pas de directive "use client" : tout import passe
// par ces réexports pour rester utilisable depuis les Server Components.
export { ThemeProvider, ThemeScript, useTheme } from "@quickadui/theme";
export type { ThemeMode, ResolvedTheme } from "@quickadui/theme";
