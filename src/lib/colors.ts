import { z } from "zod";

/**
 * Couleurs proposées pour les tags et les Espaces. Ce sont des données
 * utilisateur (pastille), pas du style d'interface : le texte et les fonds
 * restent sur les tokens sémantiques.
 */
export const SWATCHES = [
  "#E5484D",
  "#F76B15",
  "#FFC53D",
  "#30A46C",
  "#12A594",
  "#0090FF",
  "#6E56CF",
  "#D6409F",
  "#8D8D86",
] as const;

export const colorSchema = z
  .string()
  .regex(/^#[0-9a-fA-F]{6}$/, "Couleur invalide")
  .nullable();

/** Échappe %, _ et \ pour une comparaison ILIKE exacte. */
export function escapeLike(value: string): string {
  return value.replace(/[\\%_]/g, (char) => `\\${char}`);
}
