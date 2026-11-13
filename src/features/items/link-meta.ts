import type { createClient } from "@/lib/supabase/server";
import type { TablesUpdate } from "@/lib/supabase/database.types";

type Client = Awaited<ReturnType<typeof createClient>>;
type LinkMetaValues = Omit<TablesUpdate<"link_meta">, "item_id" | "workspace_id" | "created_at" | "updated_at">;

/**
 * Écrit les données d'un lien : met à jour la ligne link_meta, ou la crée
 * à la première écriture. La clé étrangère composite garantit que l'item
 * appartient bien à ce workspace. Renvoie false si l'écriture est refusée.
 */
export async function writeLinkMeta(
  supabase: Client,
  workspaceId: string,
  itemId: string,
  values: LinkMetaValues,
): Promise<boolean> {
  const { data: updated, error } = await supabase
    .from("link_meta")
    .update(values)
    .eq("workspace_id", workspaceId)
    .eq("item_id", itemId)
    .select("item_id");
  if (error) return false;
  if (updated.length > 0) return true;

  const { error: insertError } = await supabase
    .from("link_meta")
    .insert({ ...values, item_id: itemId, workspace_id: workspaceId });
  return !insertError;
}
