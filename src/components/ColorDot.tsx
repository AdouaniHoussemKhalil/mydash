import { cn } from "@quickadui/utils";

/** Pastille de couleur choisie par l'utilisateur (donnée, pas du thème). */
export function ColorDot({ color, className }: { color: string | null; className?: string | undefined }) {
  return (
    <span
      aria-hidden
      className={cn("inline-block size-2.5 shrink-0 rounded-full", !color && "bg-neutral-8", className)}
      style={color ? { backgroundColor: color } : undefined}
    />
  );
}
