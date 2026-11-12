import { z } from "zod";
import { Constants, type Tables } from "@/lib/supabase/database.types";
import { parseUrl, URL_MAX } from "@/lib/url";

export const itemTypeSchema = z.enum(Constants.public.Enums.item_type);

export const TITLE_MAX = 500;
export const BODY_MAX = 200_000;

export const titleSchema = z
  .string()
  .trim()
  .min(1, "Le titre est obligatoire")
  .max(TITLE_MAX, `${TITLE_MAX} caractères maximum`);

export const bodySchema = z.string().max(BODY_MAX, "Contenu trop long");

export const itemIdSchema = z.uuid("Identifiant invalide");

/**
 * URL http(s) normalisée (« exemple.com » → « https://exemple.com/ »).
 * Chaîne vide → null (effacer l'URL).
 */
export const urlSchema = z
  .string()
  .trim()
  .max(URL_MAX, "URL trop longue")
  .transform((value, ctx) => {
    if (value === "") return null;
    const url = parseUrl(value);
    if (!url) {
      ctx.addIssue({ code: "custom", message: "URL invalide (http ou https)" });
      return z.NEVER;
    }
    return url.toString();
  })
  .nullable();

/** Création : seul le titre est obligatoire. */
export const createItemSchema = z.object({
  type: itemTypeSchema,
  title: titleSchema,
  body: bodySchema.default(""),
  url: urlSchema.optional(),
});
export type CreateItemInput = z.input<typeof createItemSchema>;

/** Mise à jour partielle : au moins un champ. */
export const updateItemSchema = z
  .object({
    title: titleSchema,
    body: bodySchema,
    url: urlSchema,
    pinned: z.boolean(),
    archived: z.boolean(),
    in_inbox: z.boolean(),
  })
  .partial()
  .strict()
  .refine((patch) => Object.keys(patch).length > 0, "Rien à mettre à jour");
export type UpdateItemInput = z.input<typeof updateItemSchema>;

/**
 * Colonnes lues côté client (sans search_vector ni embedding), avec le
 * statut de lecture des liens (relation 1-1, null tant qu'il n'existe pas).
 */
export const ITEM_COLUMNS =
  "id, workspace_id, type, title, body, url, pinned, archived, in_inbox, parent_id, created_at, updated_at, link_meta(is_read)" as const;

export type Item = Pick<
  Tables<"items">,
  | "id"
  | "workspace_id"
  | "type"
  | "title"
  | "body"
  | "url"
  | "pinned"
  | "archived"
  | "in_inbox"
  | "parent_id"
  | "created_at"
  | "updated_at"
> & { link_meta: Pick<Tables<"link_meta">, "is_read"> | null };

/** Un lien est « lu » seulement si on l'a marqué comme tel. */
export function isRead(item: Pick<Item, "link_meta">) {
  return item.link_meta?.is_read ?? false;
}

export type { ActionResult } from "@/lib/action-result";
