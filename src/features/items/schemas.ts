import { z } from "zod";
import { Constants, type Tables } from "@/lib/supabase/database.types";

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

/** Création : seul le titre est obligatoire. */
export const createItemSchema = z.object({
  type: itemTypeSchema,
  title: titleSchema,
  body: bodySchema.default(""),
});
export type CreateItemInput = z.input<typeof createItemSchema>;

/** Mise à jour partielle : au moins un champ. */
export const updateItemSchema = z
  .object({
    title: titleSchema,
    body: bodySchema,
    pinned: z.boolean(),
    archived: z.boolean(),
    in_inbox: z.boolean(),
  })
  .partial()
  .strict()
  .refine((patch) => Object.keys(patch).length > 0, "Rien à mettre à jour");
export type UpdateItemInput = z.input<typeof updateItemSchema>;

/** Colonnes lues côté client (sans search_vector ni embedding). */
export const ITEM_COLUMNS =
  "id, workspace_id, type, title, body, pinned, archived, in_inbox, parent_id, created_at, updated_at" as const;

export type Item = Pick<
  Tables<"items">,
  | "id"
  | "workspace_id"
  | "type"
  | "title"
  | "body"
  | "pinned"
  | "archived"
  | "in_inbox"
  | "parent_id"
  | "created_at"
  | "updated_at"
>;

export type ActionResult<T = undefined> =
  | { ok: true; data: T }
  | { ok: false; error: string };
