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

/** Colonnes simples d'un item lues côté client (sans search_vector ni embedding). */
export const ITEM_FIELDS =
  "id, workspace_id, type, title, body, url, pinned, archived, in_inbox, parent_id, created_at, updated_at" as const;

/** Données propres aux liens (relation 1-1, null tant qu'elles n'existent pas). */
export const LINK_META_FIELDS =
  "is_read, page_title, description, site_name, image_url, favicon_url, fetched_at, fetch_error" as const;

/** Fichiers attachés (nom, type, taille) pour les listes. */
export const ITEM_FILE_FIELDS = "name, mime_type, size_bytes" as const;

export const ITEM_COLUMNS =
  `${ITEM_FIELDS}, link_meta(${LINK_META_FIELDS}), item_files(${ITEM_FILE_FIELDS})` as const;

export type LinkMeta = Pick<
  Tables<"link_meta">,
  "is_read" | "page_title" | "description" | "site_name" | "image_url" | "favicon_url" | "fetched_at" | "fetch_error"
>;

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
> & {
  link_meta: LinkMeta | null;
  item_files: Pick<Tables<"item_files">, "name" | "mime_type" | "size_bytes">[];
};

/** Un lien est « lu » seulement si on l'a marqué comme tel. */
export function isRead(item: Pick<Item, "link_meta">) {
  return item.link_meta?.is_read ?? false;
}

export type { ActionResult } from "@/lib/action-result";
