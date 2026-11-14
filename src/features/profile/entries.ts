import { z } from "zod";
import { Constants, type Tables } from "@/lib/supabase/database.types";
import { parseUrl } from "@/lib/url";

/** Listes du profil (une table chacune). */
export const ENTRY_KINDS = ["skills", "experiences", "education", "languages", "projects", "certifications"] as const;
export type EntryKind = (typeof ENTRY_KINDS)[number];

export const ENTRY_TABLES = {
  skills: "profile_skills",
  experiences: "profile_experiences",
  education: "profile_education",
  languages: "profile_languages",
  projects: "profile_projects",
  certifications: "profile_certifications",
} as const satisfies Record<EntryKind, string>;

export type SkillLevel = (typeof Constants.public.Enums.skill_level)[number];
export const SKILL_LEVELS = Constants.public.Enums.skill_level;
export const SKILL_LEVEL_LABELS: Record<SkillLevel, string> = {
  debutant: "Débutant",
  intermediaire: "Intermédiaire",
  avance: "Avancé",
  expert: "Expert",
};
/** Remplissage de la jauge (sur 4). */
export const SKILL_LEVEL_SCORE: Record<SkillLevel, number> = { debutant: 1, intermediaire: 2, avance: 3, expert: 4 };

export type Entries = {
  skills: Tables<"profile_skills">[];
  experiences: Tables<"profile_experiences">[];
  education: Tables<"profile_education">[];
  languages: Tables<"profile_languages">[];
  projects: Tables<"profile_projects">[];
  certifications: Tables<"profile_certifications">[];
};
export type Entry<K extends EntryKind> = Entries[K][number];

/** Listes ordonnées à la main (monter / descendre) ; les autres suivent les dates. */
export const POSITIONED: ReadonlySet<EntryKind> = new Set(["skills", "languages", "projects"]);

// ─────────────── Champs ───────────────

const text = (max: number, label = "Ce champ") =>
  z.string().trim().max(max, `${label} : ${max} caractères maximum`);
const required = (max: number, label: string) => text(max, label).min(1, `${label} : obligatoire`);

/** « AAAA-MM » (champ mois) ou « AAAA-MM-JJ » → date du 1er du mois ; vide → null. */
export const monthSchema = z
  .string()
  .trim()
  .transform((value, ctx) => {
    if (value === "") return null;
    const match = /^(\d{4})-(\d{2})(?:-\d{2})?$/.exec(value);
    const month = match ? Number(match[2]) : 0;
    if (!match || month < 1 || month > 12) {
      ctx.addIssue({ code: "custom", message: "Date invalide" });
      return z.NEVER;
    }
    return `${match[1]}-${match[2]}-01`;
  })
  .nullable();

const urlField = z
  .string()
  .trim()
  .transform((value, ctx) => {
    if (value === "") return null;
    const url = parseUrl(value);
    if (!url) {
      ctx.addIssue({ code: "custom", message: "Lien invalide (http ou https)" });
      return z.NEVER;
    }
    return url.toString();
  })
  .nullable();

const showOnCv = z.boolean().default(true);

/** La fin ne précède pas le début (dates au 1er du mois, comparables en texte). */
const datesInOrder = (entry: { start_date?: string | null; end_date?: string | null }) =>
  !entry.start_date || !entry.end_date || entry.end_date >= entry.start_date;
const DATES_MESSAGE = { message: "La fin ne peut pas précéder le début", path: ["end_date"] };

export const ENTRY_SCHEMAS = {
  skills: z
    .object({
      name: required(80, "Compétence"),
      category: text(60, "Catégorie").default(""),
      level: z.enum(SKILL_LEVELS),
      show_on_cv: showOnCv,
    })
    .strict(),
  experiences: z
    .object({
      title: required(120, "Poste"),
      organization: text(120, "Entreprise").default(""),
      location: text(120, "Lieu").default(""),
      start_date: monthSchema.refine((value) => value !== null, "Début : obligatoire"),
      end_date: monthSchema.default(null),
      description: text(3000, "Description").default(""),
      show_on_cv: showOnCv,
    })
    .strict()
    .refine(datesInOrder, DATES_MESSAGE),
  education: z
    .object({
      degree: required(160, "Diplôme"),
      school: text(160, "École").default(""),
      location: text(120, "Lieu").default(""),
      start_date: monthSchema.default(null),
      end_date: monthSchema.default(null),
      description: text(3000, "Description").default(""),
      show_on_cv: showOnCv,
    })
    .strict()
    .refine(datesInOrder, DATES_MESSAGE),
  languages: z
    .object({ name: required(60, "Langue"), level: text(60, "Niveau").default(""), show_on_cv: showOnCv })
    .strict(),
  projects: z
    .object({
      name: required(120, "Projet"),
      description: text(2000, "Description").default(""),
      url: urlField.default(null),
      show_on_cv: showOnCv,
    })
    .strict(),
  certifications: z
    .object({
      name: required(160, "Certification"),
      issuer: text(120, "Organisme").default(""),
      issued_on: monthSchema.default(null),
      url: urlField.default(null),
      show_on_cv: showOnCv,
    })
    .strict(),
} satisfies Record<EntryKind, z.ZodType>;

export type EntryInput<K extends EntryKind> = z.input<(typeof ENTRY_SCHEMAS)[K]>;

// ─────────────── Affichage ───────────────

const monthFormat = new Intl.DateTimeFormat("fr", { month: "short", year: "numeric", timeZone: "UTC" });

/** « juin 2024 » (date du 1er du mois, lue en UTC). */
export function formatMonth(date: string): string {
  return monthFormat.format(new Date(`${date.slice(0, 10)}T00:00:00Z`));
}

/** « janv. 2022 – aujourd'hui », « 2019 – 2021 »… */
export function formatPeriod(start: string | null, end: string | null, ongoingLabel = "aujourd'hui"): string {
  if (!start && !end) return "";
  if (!start) return formatMonth(end!);
  return `${formatMonth(start)} – ${end ? formatMonth(end) : ongoingLabel}`;
}

/** « AAAA-MM » pour un champ mois. */
export function toMonthInput(date: string | null): string {
  return date ? date.slice(0, 7) : "";
}
