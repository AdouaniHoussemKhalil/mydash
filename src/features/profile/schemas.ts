import { z } from "zod";
import type { Tables } from "@/lib/supabase/database.types";
import { parseUrl } from "@/lib/url";

export type Profile = Pick<
  Tables<"profiles">,
  | "full_name"
  | "headline"
  | "summary"
  | "contact_email"
  | "phone"
  | "location"
  | "website"
  | "linkedin"
  | "github"
  | "photo_path"
  | "cv_template"
  | "cv_color"
  | "updated_at"
>;

export const PROFILE_COLUMNS =
  "full_name, headline, summary, contact_email, phone, location, website, linkedin, github, photo_path, cv_template, cv_color, updated_at" as const;

/** Texte facultatif : vide → null. */
const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max, `${max} caractères maximum`)
    .transform((value) => (value === "" ? null : value))
    .nullable();

/** Lien facultatif : « linkedin.com/in/moi » → « https://linkedin.com/in/moi ». */
const optionalUrl = z
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

/** Mise à jour partielle de l'identité (un champ à la fois depuis le formulaire). */
export const profilePatchSchema = z
  .object({
    full_name: z.string().trim().max(120, "120 caractères maximum"),
    headline: z.string().trim().max(160, "160 caractères maximum"),
    summary: z.string().trim().max(3000, "3 000 caractères maximum"),
    contact_email: z
      .string()
      .trim()
      .transform((value) => (value === "" ? null : value))
      .pipe(z.email("E-mail invalide").max(254).nullable())
      .nullable(),
    phone: optionalText(40),
    location: optionalText(120),
    website: optionalUrl,
    linkedin: optionalUrl,
    github: optionalUrl,
  })
  .partial()
  .strict()
  .refine((patch) => Object.keys(patch).length > 0, "Rien à mettre à jour");
export type ProfilePatch = z.input<typeof profilePatchSchema>;
export type ProfileField = keyof z.infer<typeof profilePatchSchema>;

export const PHOTO_BUCKET = "avatars";
export const PHOTO_MAX_BYTES = 5 * 1024 * 1024;
export const PHOTO_TYPES = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" } as const;

export const photoInfoSchema = z.object({
  mimeType: z.enum(Object.keys(PHOTO_TYPES) as [keyof typeof PHOTO_TYPES], "Image JPG, PNG ou WebP uniquement"),
  size: z.number().int().min(1).max(PHOTO_MAX_BYTES, "Photo trop lourde : 5 Mo maximum"),
});

/** Initiales pour l'avatar sans photo : « Houssem Adouani » → « HA ». */
export function initials(fullName: string): string {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  const letters = parts.length > 1 ? [parts[0], parts.at(-1)] : parts.slice(0, 1);
  return letters.map((part) => part!.charAt(0).toUpperCase()).join("") || "?";
}

// ─────────────── Modèle et couleur du CV ───────────────

export const CV_TEMPLATES = ["sobre", "colonnes", "simple"] as const;
export type CvTemplate = (typeof CV_TEMPLATES)[number];

export const CV_TEMPLATE_LABELS: Record<CvTemplate, { name: string; description: string }> = {
  sobre: { name: "Sobre", description: "Une page claire, titres colorés, compétences en jauges." },
  colonnes: { name: "Deux colonnes", description: "Colonne colorée avec photo, contact, formation et langues." },
  simple: { name: "Simple", description: "Une colonne, sans photo, compétences listées sans niveau." },
};

export function isCvTemplate(value: string): value is CvTemplate {
  return (CV_TEMPLATES as readonly string[]).includes(value);
}

/** Teintes proposées (la couleur reste libre via le sélecteur). */
export const CV_COLOR_PRESETS = [
  { name: "Bleu ciel", hex: "#4FC3E8" },
  { name: "Bleu", hex: "#2563EB" },
  { name: "Turquoise", hex: "#0D9488" },
  { name: "Vert", hex: "#16A34A" },
  { name: "Violet", hex: "#7C3AED" },
  { name: "Rose", hex: "#DB2777" },
  { name: "Orange", hex: "#EA580C" },
  { name: "Ardoise", hex: "#475569" },
] as const;

export const cvChoiceSchema = z
  .object({
    template: z.enum(CV_TEMPLATES, "Modèle inconnu"),
    color: z
      .string()
      .regex(/^#[0-9a-fA-F]{6}$/, "Couleur invalide (#RRGGBB)")
      .transform((value) => value.toUpperCase())
      .nullable(),
  })
  .strict();
export type CvChoice = z.input<typeof cvChoiceSchema>;

/** Couleur sombre (texte clair par-dessus) : luminance relative WCAG < 0,4. */
export function isDarkColor(hex: string): boolean {
  const match = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(hex);
  if (!match) return false;
  const [r, g, b] = match.slice(1).map((part) => {
    const channel = parseInt(part, 16) / 255;
    return channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
  }) as [number, number, number];
  return 0.2126 * r + 0.7152 * g + 0.0722 * b < 0.4;
}
