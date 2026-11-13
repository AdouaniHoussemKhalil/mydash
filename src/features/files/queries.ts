import { getActiveWorkspaceId } from "@/features/workspace";
import { createClient } from "@/lib/supabase/server";
import { FILES_BUCKET, ITEM_FILE_COLUMNS, type ItemFile } from "./schemas";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Fichiers d'un item du workspace actif, du plus ancien au plus récent. */
export async function listItemFiles(itemId: string): Promise<ItemFile[]> {
  if (!UUID.test(itemId)) return [];
  const workspaceId = await getActiveWorkspaceId();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("item_files")
    .select(ITEM_FILE_COLUMNS)
    .eq("workspace_id", workspaceId)
    .eq("item_id", itemId)
    .order("created_at", { ascending: true });
  if (error) throw new Error("Impossible de charger les fichiers");
  return data;
}

/**
 * Supprime les objets stockés d'un item. À appeler avec les chemins lus
 * AVANT la suppression de l'item (la cascade efface les lignes item_files,
 * pas les objets : Storage n'accepte la suppression que par son API).
 */
export async function storagePathsOf(itemId: string): Promise<string[]> {
  const workspaceId = await getActiveWorkspaceId();
  const supabase = await createClient();
  const { data } = await supabase
    .from("item_files")
    .select("storage_path")
    .eq("workspace_id", workspaceId)
    .eq("item_id", itemId);
  return (data ?? []).map((row) => row.storage_path);
}

export async function removeStoredObjects(paths: string[]): Promise<void> {
  if (paths.length === 0) return;
  const supabase = await createClient();
  await supabase.storage.from(FILES_BUCKET).remove(paths);
}

/**
 * URL signée courte (60 s) vers un fichier du workspace actif : affichage
 * dans le navigateur, ou téléchargement sous son nom d'origine.
 */
export async function signedFileUrl(fileId: string, download: boolean): Promise<string | null> {
  if (!UUID.test(fileId)) return null;
  const workspaceId = await getActiveWorkspaceId();
  const supabase = await createClient();
  const { data: file } = await supabase
    .from("item_files")
    .select("storage_path, name")
    .eq("workspace_id", workspaceId)
    .eq("id", fileId)
    .maybeSingle();
  if (!file) return null;
  const { data } = await supabase.storage
    .from(FILES_BUCKET)
    .createSignedUrl(file.storage_path, 60, download ? { download: file.name } : undefined);
  return data?.signedUrl ?? null;
}
