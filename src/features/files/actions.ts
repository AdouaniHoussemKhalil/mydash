"use server";

import { refresh } from "next/cache";
import { z } from "zod";
import { getActiveWorkspaceId } from "@/features/workspace";
import { type ActionResult, firstIssue } from "@/lib/action-result";
import { createClient } from "@/lib/supabase/server";
import { FILES_BUCKET, fileIdSchema, fileInfoSchema, storagePath } from "./schemas";

const itemIdSchema = z.uuid("Élément introuvable");

export type PreparedUpload = { fileId: string; path: string; signedUrl: string };

/**
 * Étape 1 de l'envoi : vérifie l'item et le fichier, puis crée une URL
 * d'envoi signée (le navigateur envoie directement à Storage, avec suivi
 * de la progression). Les règles d'accès Storage s'appliquent à la signature.
 */
export async function prepareFileUpload(itemId: unknown, info: unknown): Promise<ActionResult<PreparedUpload>> {
  const parsedItem = itemIdSchema.safeParse(itemId);
  const parsedInfo = fileInfoSchema.safeParse(info);
  if (!parsedItem.success) return { ok: false, error: "Élément introuvable" };
  if (!parsedInfo.success) return { ok: false, error: firstIssue(parsedInfo.error) };

  const workspaceId = await getActiveWorkspaceId();
  const supabase = await createClient();
  const { data: item } = await supabase
    .from("items")
    .select("id")
    .eq("workspace_id", workspaceId)
    .eq("id", parsedItem.data)
    .maybeSingle();
  if (!item) return { ok: false, error: "Élément introuvable" };

  const fileId = crypto.randomUUID();
  const path = storagePath(workspaceId, item.id, fileId);
  const { data, error } = await supabase.storage.from(FILES_BUCKET).createSignedUploadUrl(path);
  if (error || !data) return { ok: false, error: "Envoi impossible. Réessaie." };
  return { ok: true, data: { fileId, path, signedUrl: data.signedUrl } };
}

/** Étape 2 : enregistre le fichier envoyé (taille relue dans Storage). */
export async function registerFile(
  itemId: unknown,
  fileId: unknown,
  info: unknown,
): Promise<ActionResult<{ id: string }>> {
  const parsedItem = itemIdSchema.safeParse(itemId);
  const parsedFile = fileIdSchema.safeParse(fileId);
  const parsedInfo = fileInfoSchema.safeParse(info);
  if (!parsedItem.success || !parsedFile.success) return { ok: false, error: "Fichier introuvable" };
  if (!parsedInfo.success) return { ok: false, error: firstIssue(parsedInfo.error) };

  const workspaceId = await getActiveWorkspaceId();
  const supabase = await createClient();
  const folder = `${workspaceId}/${parsedItem.data}`;
  const { data: objects } = await supabase.storage
    .from(FILES_BUCKET)
    .list(folder, { search: parsedFile.data, limit: 1 });
  const stored = objects?.find((object) => object.name === parsedFile.data);
  if (!stored) return { ok: false, error: "Fichier non reçu. Réessaie." };
  const size = Number((stored.metadata as { size?: number } | null)?.size ?? parsedInfo.data.size);

  const { data, error } = await supabase
    .from("item_files")
    .insert({
      id: parsedFile.data,
      workspace_id: workspaceId,
      item_id: parsedItem.data,
      name: parsedInfo.data.name,
      mime_type: parsedInfo.data.mimeType,
      size_bytes: size,
      storage_path: storagePath(workspaceId, parsedItem.data, parsedFile.data),
    })
    .select("id")
    .single();
  if (error || !data) {
    await supabase.storage.from(FILES_BUCKET).remove([`${folder}/${parsedFile.data}`]);
    return { ok: false, error: "Enregistrement du fichier impossible" };
  }

  refresh();
  return { ok: true, data };
}

/** Supprime un fichier : l'objet stocké, puis sa ligne. */
export async function deleteFile(fileId: unknown): Promise<ActionResult> {
  const parsed = fileIdSchema.safeParse(fileId);
  if (!parsed.success) return { ok: false, error: "Fichier introuvable" };

  const workspaceId = await getActiveWorkspaceId();
  const supabase = await createClient();
  const { data: file } = await supabase
    .from("item_files")
    .select("storage_path")
    .eq("workspace_id", workspaceId)
    .eq("id", parsed.data)
    .maybeSingle();
  if (!file) return { ok: false, error: "Fichier introuvable" };

  const { error: storageError } = await supabase.storage.from(FILES_BUCKET).remove([file.storage_path]);
  if (storageError) return { ok: false, error: "Suppression impossible. Réessaie." };
  const { error } = await supabase.from("item_files").delete().eq("workspace_id", workspaceId).eq("id", parsed.data);
  if (error) return { ok: false, error: "Suppression impossible. Réessaie." };

  refresh();
  return { ok: true, data: undefined };
}
