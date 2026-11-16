import { Binary, Braces, CalendarClock, Clock, Diff, Fingerprint, Hash, KeyRound, Link2, type LucideIcon } from "lucide-react";
import type { ToolSlug } from "./tools";

export const TOOL_ICONS: Record<ToolSlug, LucideIcon> = {
  json: Braces,
  base64: Binary,
  url: Link2,
  jwt: KeyRound,
  timestamp: Clock,
  uuid: Fingerprint,
  cron: CalendarClock,
  diff: Diff,
  hash: Hash,
};
