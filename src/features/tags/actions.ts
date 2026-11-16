"use server";

import { refresh } from "next/cache";
import { z } from "zod";
import { getActiveWorkspaceId } from "@/features/workspace";
import { type ActionResult, firstIssue } from "@/lib/action-result";
import { escapeLike } from "@/lib/colors";
import { createClient } from "@/lib/supabase/server";
import { createTagSchema, type Tag, TAG_COLUMNS, tagNameSchema, updateTagSchema } from "./schemas";

const idSchema = z.uuid();
const UNIQUE_VIOLATION = "23505";

export async function createTag(input: unknown): Promise<ActionResult<Tag>> {
  const parsed = createTagSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: firstIssue(parsed.error) };

  const workspaceId = await getActiveWorkspaceId();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("tags")
    .insert({ ...parsed.data, workspace_id: workspaceId })
    .select(TAG_COLUMNS)
    .single();
  if (error?.code === UNIQUE_VIOLATION) return { ok: false, error: "Ce tag existe déjà" };
  if (error || !data) return { ok: false, error: "Création du tag impossible" };

  refresh();
  return { ok: true, data };
}

export async function updateTag(id: unknown, patch: unknown): Promise<ActionResult> {
  const parsedId = idSchema.safeParse(id);
  const parsed = updateTagSchema.safeParse(patch);
  if (!parsedId.success) return { ok: false, error: "Tag introuvable" };
  if (!parsed.success) return { ok: false, error: firstIssue(parsed.error) };

  const workspaceId = await getActiveWorkspaceId();
  const supabase = await createClient();
  const { error, count } = await supabase
    .from("tags")
    .update(parsed.data, { count: "exact" })
    .eq("workspace_id", workspaceId)
    .eq("id", parsedId.data);
  if (error?.code === UNIQUE_VIOLATION) return { ok: false, error: "Un tag porte déjà ce nom" };
  if (error) return { ok: false, error: "Modification impossible" };
  if (!count) return { ok: false, error: "Tag introuvable" };

  refresh();
  return { ok: true, data: undefined };
}

export async function deleteTag(id: unknown): Promise<ActionResult> {
  const parsedId = idSchema.safeParse(id);
  if (!parsedId.success) return { ok: false, error: "Tag introuvable" };

  const workspaceId = await getActiveWorkspaceId();
  const supabase = await createClient();
  const { error } = await supabase
    .from("tags")
    .delete()
    .eq("workspace_id", workspaceId)
    .eq("id", parsedId.data);
  if (error) return { ok: false, error: "Suppression impossible" };

  refresh();
  return { ok: true, data: undefined };
}

/** Ajoute un tag à un item par son nom ; le crée s'il n'existe pas. */
export async function attachTag(itemId: unknown, name: unknown): Promise<ActionResult<Tag>> {
  const parsedItem = idSchema.safeParse(itemId);
  const parsedName = tagNameSchema.safeParse(name);
  if (!parsedItem.success) return { ok: false, error: "Élément introuvable" };
  if (!parsedName.success) return { ok: false, error: firstIssue(parsedName.error) };

  const workspaceId = await getActiveWorkspaceId();
  const supabase = await createClient();

  const { data: existing } = await supabase
    .from("tags")
    .select(TAG_COLUMNS)
    .eq("workspace_id", workspaceId)
    .ilike("name", escapeLike(parsedName.data))
    .maybeSingle();

  let tag = existing;
  if (!tag) {
    const created = await supabase
      .from("tags")
      .insert({ workspace_id: workspaceId, name: parsedName.data })
      .select(TAG_COLUMNS)
      .single();
    if (created.error || !created.data) return { ok: false, error: "Création du tag impossible" };
    tag = created.data;
  }

  const { error } = await supabase
    .from("item_tags")
    .upsert(
      { workspace_id: workspaceId, item_id: parsedItem.data, tag_id: tag.id },
      { onConflict: "item_id,tag_id", ignoreDuplicates: true },
    );
  if (error) return { ok: false, error: "Impossible d'ajouter le tag" };

  refresh();
  return { ok: true, data: tag };
}

export async function detachTag(itemId: unknown, tagId: unknown): Promise<ActionResult> {
  const parsedItem = idSchema.safeParse(itemId);
  const parsedTag = idSchema.safeParse(tagId);
  if (!parsedItem.success || !parsedTag.success) return { ok: false, error: "Tag introuvable" };

  const workspaceId = await getActiveWorkspaceId();
  const supabase = await createClient();
  const { error } = await supabase
    .from("item_tags")
    .delete()
    .eq("workspace_id", workspaceId)
    .eq("item_id", parsedItem.data)
    .eq("tag_id", parsedTag.data);
  if (error) return { ok: false, error: "Impossible de retirer le tag" };

  refresh();
  return { ok: true, data: undefined };
}
