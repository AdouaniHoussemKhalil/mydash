import { getActiveWorkspaceId } from "@/features/workspace";
import { createClient } from "@/lib/supabase/server";
import { type Item, ITEM_COLUMNS, ITEM_FIELDS, itemIdSchema } from "./schemas";
import { toPrefixQuery } from "./search";

export { getActiveWorkspaceId };

export type ListItemsOptions = {
  type?: Item["type"] | undefined;
  inbox?: boolean | undefined;
  pinned?: boolean | undefined;
  archived?: boolean | undefined;
  limit?: number | undefined;
  /** Items portant ce tag. */
  tagId?: string | undefined;
  /** Items rangés dans cet Espace. */
  spaceId?: string | undefined;
};

export async function listItems({
  type,
  inbox,
  pinned,
  archived = false,
  limit = 100,
  tagId,
  spaceId,
}: ListItemsOptions = {}): Promise<Item[]> {
  if (tagId && !itemIdSchema.safeParse(tagId).success) return [];
  if (spaceId && !itemIdSchema.safeParse(spaceId).success) return [];
  const workspaceId = await getActiveWorkspaceId();
  const supabase = await createClient();

  // Jointures internes : ne garder que les items liés au tag / à l'Espace.
  const joins = [tagId && "item_tags!inner(tag_id)", spaceId && "item_spaces!inner(space_id)"]
    .filter(Boolean)
    .join(", ");
  let query = supabase
    .from("items")
    .select(joins ? `${ITEM_COLUMNS}, ${joins}` : ITEM_COLUMNS)
    .eq("workspace_id", workspaceId)
    .eq("archived", archived)
    .order("updated_at", { ascending: false })
    .limit(limit);
  if (type) query = query.eq("type", type);
  if (inbox !== undefined) query = query.eq("in_inbox", inbox);
  if (pinned !== undefined) query = query.eq("pinned", pinned);
  if (tagId) query = query.eq("item_tags.tag_id", tagId);
  if (spaceId) query = query.eq("item_spaces.space_id", spaceId);

  const { data, error } = await query;
  if (error) throw new Error("Impossible de charger les éléments");
  // Ne renvoyer que les colonnes d'Item (sans celles des jointures).
  return (data as unknown as Item[]).map(pickItem);
}

// Clés d'Item : colonnes simples + les relations link_meta et item_files.
const ITEM_KEYS = [...ITEM_FIELDS.split(", "), "link_meta", "item_files"] as (keyof Item)[];

function pickItem(row: Item): Item {
  return Object.fromEntries(ITEM_KEYS.map((key) => [key, row[key]])) as Item;
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

/** Recherche rapide (palette) : préfixes sur le titre et le contenu, titres d'abord. */
export async function searchItems(query: string, limit = 8): Promise<Item[]> {
  const tsquery = toPrefixQuery(query);
  if (!tsquery) return [];
  const workspaceId = await getActiveWorkspaceId();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("items")
    .select(ITEM_COLUMNS)
    .eq("workspace_id", workspaceId)
    .eq("archived", false)
    .textSearch("search_vector", tsquery, { config: "simple" })
    .order("updated_at", { ascending: false })
    .limit(limit);
  if (error) throw new Error("Recherche impossible");
  return data;
}
