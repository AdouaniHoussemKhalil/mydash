import {
  BookOpen,
  CalendarDays,
  CircleCheck,
  Code,
  FileText,
  GitBranch,
  Inbox,
  Link2,
  type LucideIcon,
  MessageSquareText,
  Search,
  Sparkles,
  StickyNote,
  Sun,
  Wrench,
} from "lucide-react";
import type { ModuleSlug } from "./modules";

export const MODULE_ICONS: Record<ModuleSlug, LucideIcon> = {
  links: Link2,
  notes: StickyNote,
  docs: BookOpen,
  files: FileText,
  repos: GitBranch,
  tools: Wrench,
  prompts: MessageSquareText,
  skills: Sparkles,
  snippets: Code,
  tasks: CircleCheck,
  calendar: CalendarDays,
};

export const NAV_ICONS: Record<string, LucideIcon> = {
  "/today": Sun,
  "/inbox": Inbox,
  "/search": Search,
};
