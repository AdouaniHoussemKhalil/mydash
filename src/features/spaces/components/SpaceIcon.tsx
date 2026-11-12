import { Layers } from "lucide-react";
import { ColorDot } from "@/components/ColorDot";
import type { Space } from "../schemas";

/** Emoji de l'Espace, sinon pastille de couleur, sinon icône générique. */
export function SpaceIcon({ space }: { space: Pick<Space, "icon" | "color"> }) {
  if (space.icon) return <span aria-hidden className="w-5 text-center leading-none">{space.icon}</span>;
  if (space.color) return <ColorDot color={space.color} className="mx-1.5" />;
  return <Layers aria-hidden />;
}
