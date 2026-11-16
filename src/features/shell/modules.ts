import type { Enums } from "@/lib/supabase/database.types";

export type ItemType = Enums<"item_type">;

export type ModuleDef = {
  /** Segment d'URL : /links, /notes… */
  slug: string;
  label: string;
  /** Type d'item affiché par le module. */
  type: ItemType;
  /** Libellé d'un élément au singulier (badge de type). */
  itemLabel: string;
  description: string;
};

/** Modules de la sidebar, dans l'ordre d'affichage. */
export const MODULES = [
  { slug: "links", label: "Liens", type: "link", itemLabel: "Lien", description: "Articles, sites et ressources à garder." },
  { slug: "notes", label: "Notes", type: "note", itemLabel: "Note", description: "Notes Markdown reliées entre elles." },
  { slug: "docs", label: "Docs", type: "doc", itemLabel: "Doc", description: "Documentation organisée en arborescence." },
  { slug: "files", label: "Fichiers", type: "file", itemLabel: "Fichier", description: "PDF, images et documents." },
  { slug: "repos", label: "Repos", type: "repo", itemLabel: "Repo", description: "Suivi de tes dépôts Git." },
  { slug: "tools", label: "Outils", type: "tool", itemLabel: "Outil", description: "Tes outils favoris, par catégorie." },
  { slug: "prompts", label: "Prompts", type: "prompt", itemLabel: "Prompt", description: "Prompts réutilisables avec variables." },
  { slug: "skills", label: "Skills", type: "skill", itemLabel: "Skill", description: "Skills et leurs fichiers versionnés." },
  { slug: "snippets", label: "Snippets", type: "snippet", itemLabel: "Snippet", description: "Extraits de code." },
  { slug: "tasks", label: "Tâches", type: "task", itemLabel: "Tâche", description: "Tâches liées à n'importe quel élément." },
  { slug: "calendar", label: "Calendrier", type: "event", itemLabel: "Événement", description: "Événements et échéances." },
] as const satisfies readonly ModuleDef[];

export type ModuleSlug = (typeof MODULES)[number]["slug"];

export function getModule(slug: string): ModuleDef | undefined {
  return MODULES.find((module) => module.slug === slug);
}

export function getModuleByType(type: ItemType): ModuleDef {
  // Chaque type d'item a exactement un module (vérifié par les tests).
  return MODULES.find((module) => module.type === type)!;
}

export const PRIMARY_NAV = [
  { href: "/today", label: "Aujourd'hui" },
  { href: "/inbox", label: "Inbox" },
  { href: "/search", label: "Recherche" },
] as const;
