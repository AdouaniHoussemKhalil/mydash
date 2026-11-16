"use server";

import { getActiveWorkspaceId } from "@/features/workspace";
import { type ActionResult, firstIssue } from "@/lib/action-result";
import { createClient } from "@/lib/supabase/server";
import { getSharedClipboard } from "./queries";
import { clipboardTextSchema, type SharedClipboard } from "./schemas";

/** Relecture (retour sur l'onglet) : le texte a pu changer depuis une autre machine. */
export async function readSharedClipboard(): Promise<ActionResult<SharedClipboard>> {
  try {
    return { ok: true, data: await getSharedClipboard() };
  } catch {
    return { ok: false, error: "Impossible de charger le presse-papiers" };
  }
}

/** Remplace le texte du presse-papiers partagé (chaîne vide pour le vider). */
export async function saveSharedClipboard(text: unknown): Promise<ActionResult<{ updatedAt: string }>> {
  const parsed = clipboardTextSchema.safeParse(text);
  if (!parsed.success) return { ok: false, error: firstIssue(parsed.error) };

  const workspaceId = await getActiveWorkspaceId();
  const supabase = await createClient();
  const failure = { ok: false as const, error: "Enregistrement impossible. Réessaie." };

  // Mise à jour, sinon première écriture (seul « text » est modifiable).
  const updated = await supabase
    .from("shared_clipboard")
    .update({ text: parsed.data })
    .eq("workspace_id", workspaceId)
    .select("updated_at")
    .maybeSingle();
  if (updated.error) return failure;
  if (updated.data) return { ok: true, data: { updatedAt: updated.data.updated_at } };

  const inserted = await supabase
    .from("shared_clipboard")
    .insert({ workspace_id: workspaceId, text: parsed.data })
    .select("updated_at")
    .single();
  if (inserted.error || !inserted.data) return failure;
  return { ok: true, data: { updatedAt: inserted.data.updated_at } };
}
