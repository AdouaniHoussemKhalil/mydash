"use client";

import { Monitor, Moon, Sun } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
  IconButton,
} from "@/components/ui/core";
import { type ThemeMode, useTheme } from "@/components/ui/theme";
import { useIsClient } from "@/hooks/useIsClient";

const OPTIONS: { value: ThemeMode; label: string }[] = [
  { value: "light", label: "Clair" },
  { value: "dark", label: "Sombre" },
  { value: "system", label: "Système" },
];

function isThemeMode(value: string): value is ThemeMode {
  return OPTIONS.some((option) => option.value === value);
}

export function ThemeMenu() {
  const { theme, resolvedTheme, setTheme } = useTheme();
  // Le thème mémorisé n'est connu que du navigateur : icône neutre jusqu'au
  // montage pour ne pas diverger du HTML serveur (erreur d'hydratation).
  const isClient = useIsClient();
  const Icon = !isClient || theme === "system" ? Monitor : resolvedTheme === "dark" ? Moon : Sun;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <IconButton variant="ghost" aria-label="Changer le thème">
          <Icon className="size-4" />
        </IconButton>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Thème</DropdownMenuLabel>
        <DropdownMenuRadioGroup
          value={theme}
          onValueChange={(value) => {
            if (isThemeMode(value)) setTheme(value);
          }}
        >
          {OPTIONS.map((option) => (
            <DropdownMenuRadioItem key={option.value} value={option.value}>
              {option.label}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
