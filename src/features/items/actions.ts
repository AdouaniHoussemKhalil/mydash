"use server";

import { refresh } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";
import { getActiveWorkspaceId, searchItems } from "./queries";
import {
  type ActionResult,
  createItemSchema,
  type Item,
  itemIdSchema,
  updateItemSchema,
} from "./schemas";

/** Crée un item dans le workspace actif. Seul le titre est obligatoire. */
export async function createItem(
  input: unknown,
): Promise<ActionResult<Pick<Item, "id" | "type">>> {
  const parsed = createItemSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Données invalides" };
  }

  // getActiveWorkspaceId vérifie la session (redirige vers /login sinon).
  const workspaceId = await getActiveWorkspaceId();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("items")
    .insert({ ...parsed.data, workspace_id: workspaceId })
    .select("id, type")
    .single();
  if (error || !data) return { ok: false, error: "Création impossible. Réessaie." };

  refresh();
  return { ok: true, data };
}

/** Mise à jour partielle (édition en place, épingler, archiver, Inbox). */
export async function updateItem(
  id: unknown,
  patch: unknown,
): Promise<ActionResult<Pick<Item, "updated_at">>> {
  const parsedId = itemIdSchema.safeParse(id);
  const parsed = updateItemSchema.safeParse(patch);
  if (!parsedId.success) return { ok: false, error: "Élément introuvable" };
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Données invalides" };
  }

  const workspaceId = await getActiveWorkspaceId();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("items")
    .update(parsed.data)
    .eq("workspace_id", workspaceId)
    .eq("id", parsedId.data)
    .select("updated_at")
    .maybeSingle();
  if (error) return { ok: false, error: "Enregistrement impossible. Réessaie." };
  if (!data) return { ok: false, error: "Élément introuvable ou accès refusé" };

  refresh();
  return { ok: true, data };
}

export async function deleteItem(id: unknown): Promise<ActionResult> {
  const parsed = itemIdSchema.safeParse(id);
  if (!parsed.success) return { ok: false, error: "Élément introuvable" };

  const workspaceId = await getActiveWorkspaceId();
  const supabase = await createClient();
  const { error, count } = await supabase
    .from("items")
    .delete({ count: "exact" })
    .eq("workspace_id", workspaceId)
    .eq("id", parsed.data);
  if (error) return { ok: false, error: "Suppression impossible. Réessaie." };
  if (!count) return { ok: false, error: "Élément introuvable ou accès refusé" };

  refresh();
  return { ok: true, data: undefined };
}

const searchQuerySchema = z.string().trim().min(1).max(200);

/** Recherche rapide pour la palette (lecture seule). */
export async function quickSearch(query: unknown): Promise<ActionResult<Item[]>> {
  const parsed = searchQuerySchema.safeParse(query);
  if (!parsed.success) return { ok: true, data: [] };
  try {
    return { ok: true, data: await searchItems(parsed.data) };
  } catch {
    return { ok: false, error: "Recherche impossible" };
  }
}
