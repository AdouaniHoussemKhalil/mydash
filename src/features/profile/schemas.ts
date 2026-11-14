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
  | "updated_at"
>;

export const PROFILE_COLUMNS =
  "full_name, headline, summary, contact_email, phone, location, website, linkedin, github, photo_path, updated_at" as const;

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
