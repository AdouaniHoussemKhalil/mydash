import { Braces, Link2, type LucideIcon, Binary } from "lucide-react";
import type { ToolSlug } from "./tools";

export const TOOL_ICONS: Record<ToolSlug, LucideIcon> = {
  json: Braces,
  base64: Binary,
  url: Link2,
};
