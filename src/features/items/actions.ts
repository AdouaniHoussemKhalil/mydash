"use server";

import { refresh } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getActiveWorkspaceId } from "./queries";
import { type ActionResult, createItemSchema, type Item, itemIdSchema } from "./schemas";

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
