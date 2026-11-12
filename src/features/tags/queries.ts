import { getActiveWorkspaceId } from "@/features/workspace";
import { createClient } from "@/lib/supabase/server";
import { type Tag, TAG_COLUMNS } from "./schemas";

export async function listTags(): Promise<Tag[]> {
  const workspaceId = await getActiveWorkspaceId();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("tags")
    .select(TAG_COLUMNS)
    .eq("workspace_id", workspaceId)
    .order("name");
  if (error) throw new Error("Impossible de charger les tags");
  return data;
}

/** Tags d'un item, triés par nom. */
export async function getItemTags(itemId: string): Promise<Tag[]> {
  const workspaceId = await getActiveWorkspaceId();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("item_tags")
    .select(`tags (${TAG_COLUMNS})`)
    .eq("workspace_id", workspaceId)
    .eq("item_id", itemId);
  if (error) throw new Error("Impossible de charger les tags");
  return data
    .flatMap((row) => (row.tags ? [row.tags] : []))
    .sort((a, b) => a.name.localeCompare(b.name, "fr"));
}
