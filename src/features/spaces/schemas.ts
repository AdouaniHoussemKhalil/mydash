import { z } from "zod";
import { colorSchema } from "@/lib/colors";
import type { Tables } from "@/lib/supabase/database.types";

export const spaceNameSchema = z
  .string()
  .trim()
  .min(1, "Le nom est obligatoire")
  .max(80, "80 caractères maximum");

/** Icône : un emoji ou un symbole court (pas d'URL ni de HTML). */
export const spaceIconSchema = z
  .string()
  .trim()
  .max(8, "Icône trop longue")
  .transform((value) => value || null)
  .nullable();

export const createSpaceSchema = z.object({
  name: spaceNameSchema,
  icon: spaceIconSchema.default(null),
  color: colorSchema.default(null),
});

export const updateSpaceSchema = z
  .object({ name: spaceNameSchema, icon: spaceIconSchema, color: colorSchema })
  .partial()
  .strict()
  .refine((patch) => Object.keys(patch).length > 0, "Rien à mettre à jour");

export const SPACE_COLUMNS = "id, name, icon, color, position" as const;
export type Space = Pick<Tables<"spaces">, "id" | "name" | "icon" | "color" | "position">;
