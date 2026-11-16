import type { Item } from "./schemas";

export type Draft = Pick<Item, "title" | "body">;

/**
 * Champs à enregistrer entre la dernière version sauvée et le brouillon.
 * Un titre vide n'est jamais envoyé (le titre est obligatoire).
 */
export function draftPatch(saved: Draft, draft: Draft): Partial<Draft> | null {
  const patch: Partial<Draft> = {};
  const title = draft.title.trim();
  if (title && title !== saved.title) patch.title = title;
  if (draft.body !== saved.body) patch.body = draft.body;
  return Object.keys(patch).length > 0 ? patch : null;
}
