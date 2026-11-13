"use server";

import { refresh } from "next/cache";
import { removeStoredObjects, storagePathsOf } from "@/features/files";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";
import { writeLinkMeta } from "./link-meta";
import { writeTaskDetails } from "./task-details";
import { taskPatchSchema } from "./tasks";
import { getActiveWorkspaceId, LINK_RELATION, searchItems } from "./queries";
import { repoFromHref, repoUrl } from "@/lib/repo";
import { parseUrl, urlTitle } from "@/lib/url";

const NOT_A_REPO = "Ce n'est pas l'URL d'un dépôt GitHub ou GitLab";

/** URL d'un repo : celle d'un dépôt, ramenée à sa forme canonique. */
function canonicalRepoUrl(url: string): string | null {
  const repo = repoFromHref(url);
  return repo ? repoUrl(repo) : null;
}
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
  const { task, ...fields } = parsed.data;
  if (fields.type === "repo" && fields.url) {
    const canonical = canonicalRepoUrl(fields.url);
    if (!canonical) return { ok: false, error: NOT_A_REPO };
    fields.url = canonical;
  }
  const { data, error } = await supabase
    .from("items")
    .insert({ ...fields, workspace_id: workspaceId })
    .select("id, type")
    .single();
  if (error || !data) return { ok: false, error: "Création impossible. Réessaie." };

  // Une tâche a toujours sa ligne task_details (filtre par état, calendrier).
  if (data.type === "task") {
    const written = await writeTaskDetails(supabase, workspaceId, data.id, {
      status: task?.status ?? "todo",
      due_date: task?.due_date ?? null,
    });
    if (!written) {
      await supabase.from("items").delete().eq("workspace_id", workspaceId).eq("id", data.id);
      return { ok: false, error: "Création impossible. Réessaie." };
    }
  }

  refresh();
  return { ok: true, data };
}

/** État et échéance d'une tâche. */
export async function setTaskDetails(id: unknown, patch: unknown): Promise<ActionResult> {
  const parsedId = itemIdSchema.safeParse(id);
  const parsed = taskPatchSchema.safeParse(patch);
  if (!parsedId.success) return { ok: false, error: "Tâche introuvable" };
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Données invalides" };

  const workspaceId = await getActiveWorkspaceId();
  const supabase = await createClient();
  const { data: item } = await supabase
    .from("items")
    .select("type")
    .eq("workspace_id", workspaceId)
    .eq("id", parsedId.data)
    .maybeSingle();
  if (item?.type !== "task") return { ok: false, error: "Tâche introuvable" };

  const written = await writeTaskDetails(supabase, workspaceId, parsedId.data, parsed.data);
  if (!written) return { ok: false, error: "Enregistrement impossible. Réessaie." };

  refresh();
  return { ok: true, data: undefined };
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
  const patchData = { ...parsed.data };
  // Un repo ne peut pointer que vers un dépôt.
  if (patchData.url) {
    const { data: current } = await supabase
      .from("items")
      .select("type")
      .eq("workspace_id", workspaceId)
      .eq("id", parsedId.data)
      .maybeSingle();
    if (current?.type === "repo") {
      const canonical = canonicalRepoUrl(patchData.url);
      if (!canonical) return { ok: false, error: NOT_A_REPO };
      patchData.url = canonical;
    }
  }
  const { data, error } = await supabase
    .from("items")
    .update(patchData)
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
  // Chemins lus avant : la cascade efface les lignes, pas les objets stockés.
  const storedFiles = await storagePathsOf(parsed.data);
  const { error, count } = await supabase
    .from("items")
    .delete({ count: "exact" })
    .eq("workspace_id", workspaceId)
    .eq("id", parsed.data);
  if (error) return { ok: false, error: "Suppression impossible. Réessaie." };
  if (!count) return { ok: false, error: "Élément introuvable ou accès refusé" };
  await removeStoredObjects(storedFiles);

  refresh();
  return { ok: true, data: undefined };
}

/**
 * Statut de lecture d'un lien (ligne link_meta créée à la première utilisation).
 */
export async function setLinkRead(id: unknown, isRead: unknown): Promise<ActionResult> {
  const parsedId = itemIdSchema.safeParse(id);
  const parsedRead = z.boolean().safeParse(isRead);
  if (!parsedId.success || !parsedRead.success) return { ok: false, error: "Données invalides" };

  const workspaceId = await getActiveWorkspaceId();
  const supabase = await createClient();
  const written = await writeLinkMeta(supabase, workspaceId, parsedId.data, { is_read: parsedRead.data });
  if (!written) return { ok: false, error: "Élément introuvable ou accès refusé" };

  refresh();
  return { ok: true, data: undefined };
}

/**
 * Attache un lien à un élément : réutilise le lien de même URL s'il existe
 * dans le workspace, sinon le crée (visible aussi dans le module Liens).
 */
export async function attachLink(
  itemId: unknown,
  rawUrl: unknown,
): Promise<ActionResult<{ id: string; created: boolean }>> {
  const parsedId = itemIdSchema.safeParse(itemId);
  if (!parsedId.success) return { ok: false, error: "Élément introuvable" };
  const url = typeof rawUrl === "string" ? parseUrl(rawUrl) : null;
  if (!url) return { ok: false, error: "URL invalide (http ou https)" };
  const href = url.toString();

  const workspaceId = await getActiveWorkspaceId();
  const supabase = await createClient();
  const { data: existing } = await supabase
    .from("items")
    .select("id")
    .eq("workspace_id", workspaceId)
    .eq("type", "link")
    .eq("url", href)
    .limit(1)
    .maybeSingle();

  let linkId = existing?.id;
  if (!linkId) {
    const { data: created, error } = await supabase
      .from("items")
      // Rattaché à un élément : déjà classé, pas dans l'Inbox.
      .insert({ workspace_id: workspaceId, type: "link", title: urlTitle(url), url: href, in_inbox: false })
      .select("id")
      .single();
    if (error || !created) return { ok: false, error: "Création du lien impossible" };
    linkId = created.id;
  }
  if (linkId === parsedId.data) return { ok: false, error: "Un lien ne peut pas se citer lui-même" };

  const { error: relationError } = await supabase
    .from("item_links")
    .insert({ workspace_id: workspaceId, from_item: parsedId.data, to_item: linkId, relation: LINK_RELATION });
  if (relationError) {
    return {
      ok: false,
      error: relationError.code === "23505" ? "Ce lien est déjà attaché" : "Impossible d'attacher le lien",
    };
  }

  refresh();
  return { ok: true, data: { id: linkId, created: !existing } };
}

/** Détache un lien (le lien lui-même reste dans le module Liens). */
export async function detachLink(itemId: unknown, linkId: unknown): Promise<ActionResult> {
  const parsedItem = itemIdSchema.safeParse(itemId);
  const parsedLink = itemIdSchema.safeParse(linkId);
  if (!parsedItem.success || !parsedLink.success) return { ok: false, error: "Lien introuvable" };

  const workspaceId = await getActiveWorkspaceId();
  const supabase = await createClient();
  const { error } = await supabase
    .from("item_links")
    .delete()
    .eq("workspace_id", workspaceId)
    .eq("from_item", parsedItem.data)
    .eq("to_item", parsedLink.data)
    .eq("relation", LINK_RELATION);
  if (error) return { ok: false, error: "Impossible de retirer le lien" };

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
