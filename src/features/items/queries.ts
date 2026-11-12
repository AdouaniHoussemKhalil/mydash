import { cache } from "react";
import { getCurrentUser } from "@/features/auth";
import { createClient } from "@/lib/supabase/server";
import { type Item, ITEM_COLUMNS, itemIdSchema } from "./schemas";

/**
 * Workspace actif. MVP : le workspace personnel. Quand le partage
 * arrivera, ce choix viendra d'un sélecteur (cookie), sans toucher aux appelants.
 */
export const getActiveWorkspaceId = cache(async (): Promise<string> => {
  const user = await getCurrentUser();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("workspaces")
    .select("id")
    .eq("is_personal", true)
    .eq("created_by", user.id)
    .single();
  if (error || !data) throw new Error("Workspace personnel introuvable");
  return data.id;
});

export type ListItemsOptions = {
  type?: Item["type"] | undefined;
  inbox?: boolean | undefined;
  pinned?: boolean | undefined;
  archived?: boolean | undefined;
  limit?: number | undefined;
};

export async function listItems({
  type,
  inbox,
  pinned,
  archived = false,
  limit = 100,
}: ListItemsOptions = {}): Promise<Item[]> {
  const workspaceId = await getActiveWorkspaceId();
  const supabase = await createClient();

  let query = supabase
    .from("items")
    .select(ITEM_COLUMNS)
    .eq("workspace_id", workspaceId)
    .eq("archived", archived)
    .order("updated_at", { ascending: false })
    .limit(limit);
  if (type) query = query.eq("type", type);
  if (inbox !== undefined) query = query.eq("in_inbox", inbox);
  if (pinned !== undefined) query = query.eq("pinned", pinned);

  const { data, error } = await query;
  if (error) throw new Error("Impossible de charger les éléments");
  return data;
}

/** Un item du workspace actif, ou null (id invalide, absent ou inaccessible). */
export async function getItem(id: string): Promise<Item | null> {
  if (!itemIdSchema.safeParse(id).success) return null;
  const workspaceId = await getActiveWorkspaceId();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("items")
    .select(ITEM_COLUMNS)
    .eq("workspace_id", workspaceId)
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error("Impossible de charger l'élément");
  return data;
}
