"use server";

import { refresh } from "next/cache";
import { z } from "zod";
import { getActiveWorkspaceId } from "@/features/workspace";
import { type ActionResult, firstIssue } from "@/lib/action-result";
import { createClient } from "@/lib/supabase/server";
import { createSpaceSchema, type Space, SPACE_COLUMNS, updateSpaceSchema } from "./schemas";

const idSchema = z.uuid();

export async function createSpace(input: unknown): Promise<ActionResult<Space>> {
  const parsed = createSpaceSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: firstIssue(parsed.error) };

  const workspaceId = await getActiveWorkspaceId();
  const supabase = await createClient();
  // Nouvel Espace en fin de liste.
  const { count } = await supabase
    .from("spaces")
    .select("id", { count: "exact", head: true })
    .eq("workspace_id", workspaceId);

  const { data, error } = await supabase
    .from("spaces")
    .insert({ ...parsed.data, workspace_id: workspaceId, position: count ?? 0 })
    .select(SPACE_COLUMNS)
    .single();
  if (error || !data) return { ok: false, error: "Création de l'Espace impossible" };

  refresh();
  return { ok: true, data };
}

export async function updateSpace(id: unknown, patch: unknown): Promise<ActionResult> {
  const parsedId = idSchema.safeParse(id);
  const parsed = updateSpaceSchema.safeParse(patch);
  if (!parsedId.success) return { ok: false, error: "Espace introuvable" };
  if (!parsed.success) return { ok: false, error: firstIssue(parsed.error) };

  const workspaceId = await getActiveWorkspaceId();
  const supabase = await createClient();
  const { error, count } = await supabase
    .from("spaces")
    .update(parsed.data, { count: "exact" })
    .eq("workspace_id", workspaceId)
    .eq("id", parsedId.data);
  if (error) return { ok: false, error: "Modification impossible" };
  if (!count) return { ok: false, error: "Espace introuvable" };

  refresh();
  return { ok: true, data: undefined };
}

/** Supprime l'Espace ; ses éléments sont conservés (seule la liaison disparaît). */
export async function deleteSpace(id: unknown): Promise<ActionResult> {
  const parsedId = idSchema.safeParse(id);
  if (!parsedId.success) return { ok: false, error: "Espace introuvable" };

  const workspaceId = await getActiveWorkspaceId();
  const supabase = await createClient();
  const { error } = await supabase
    .from("spaces")
    .delete()
    .eq("workspace_id", workspaceId)
    .eq("id", parsedId.data);
  if (error) return { ok: false, error: "Suppression impossible" };

  refresh();
  return { ok: true, data: undefined };
}

/** Range un item dans un Espace : il sort de l'Inbox (il est classé). */
export async function addItemToSpace(itemId: unknown, spaceId: unknown): Promise<ActionResult> {
  const parsedItem = idSchema.safeParse(itemId);
  const parsedSpace = idSchema.safeParse(spaceId);
  if (!parsedItem.success || !parsedSpace.success) return { ok: false, error: "Espace introuvable" };

  const workspaceId = await getActiveWorkspaceId();
  const supabase = await createClient();
  const { error } = await supabase
    .from("item_spaces")
    .upsert(
      { workspace_id: workspaceId, item_id: parsedItem.data, space_id: parsedSpace.data },
      { onConflict: "item_id,space_id", ignoreDuplicates: true },
    );
  if (error) return { ok: false, error: "Impossible d'ajouter à l'Espace" };

  await supabase
    .from("items")
    .update({ in_inbox: false })
    .eq("workspace_id", workspaceId)
    .eq("id", parsedItem.data);

  refresh();
  return { ok: true, data: undefined };
}

export async function removeItemFromSpace(itemId: unknown, spaceId: unknown): Promise<ActionResult> {
  const parsedItem = idSchema.safeParse(itemId);
  const parsedSpace = idSchema.safeParse(spaceId);
  if (!parsedItem.success || !parsedSpace.success) return { ok: false, error: "Espace introuvable" };

  const workspaceId = await getActiveWorkspaceId();
  const supabase = await createClient();
  const { error } = await supabase
    .from("item_spaces")
    .delete()
    .eq("workspace_id", workspaceId)
    .eq("item_id", parsedItem.data)
    .eq("space_id", parsedSpace.data);
  if (error) return { ok: false, error: "Impossible de retirer de l'Espace" };

  refresh();
  return { ok: true, data: undefined };
}
