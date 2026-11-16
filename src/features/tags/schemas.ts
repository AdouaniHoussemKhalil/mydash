import { z } from "zod";
import { colorSchema } from "@/lib/colors";
import type { Tables } from "@/lib/supabase/database.types";

export const tagNameSchema = z
  .string()
  .trim()
  .min(1, "Nom de tag requis")
  .max(50, "50 caractères maximum")
  // Un tag reste un mot-clé : pas de « # » en tête, pas de retour à la ligne.
  .transform((name) => name.replace(/^#+/, "").replace(/\s+/g, " ").trim())
  .pipe(z.string().min(1, "Nom de tag requis"));

export const createTagSchema = z.object({
  name: tagNameSchema,
  color: colorSchema.default(null),
});

export const updateTagSchema = z
  .object({ name: tagNameSchema, color: colorSchema })
  .partial()
  .strict()
  .refine((patch) => Object.keys(patch).length > 0, "Rien à mettre à jour");

export const TAG_COLUMNS = "id, name, color" as const;
export type Tag = Pick<Tables<"tags">, "id" | "name" | "color">;
