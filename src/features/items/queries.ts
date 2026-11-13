import { getActiveWorkspaceId } from "@/features/workspace";
import { createClient } from "@/lib/supabase/server";
import { type Item, ITEM_COLUMNS, ITEM_FIELDS, itemIdSchema } from "./schemas";
import type { TaskStatus } from "./tasks";
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
  /** Tâches dans cet état. */
  taskStatus?: TaskStatus | undefined;
};

export async function listItems({
  type,
  inbox,
  pinned,
  archived = false,
  limit = 100,
  tagId,
  spaceId,
  taskStatus,
}: ListItemsOptions = {}): Promise<Item[]> {
  if (tagId && !itemIdSchema.safeParse(tagId).success) return [];
  if (spaceId && !itemIdSchema.safeParse(spaceId).success) return [];
  const workspaceId = await getActiveWorkspaceId();
  const supabase = await createClient();

  // Jointures internes : ne garder que les items liés au tag / à l'Espace.
  // task_details est déjà lu : la jointure de filtre prend un alias.
  const joins = [
    tagId && "item_tags!inner(tag_id)",
    spaceId && "item_spaces!inner(space_id)",
    taskStatus && "task_filter:task_details!inner(status)",
  ]
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
  if (taskStatus) query = query.eq("task_filter.status", taskStatus);

  const { data, error } = await query;
  if (error) throw new Error("Impossible de charger les éléments");
  // Ne renvoyer que les colonnes d'Item (sans celles des jointures).
  return (data as unknown as Item[]).map(pickItem);
}

// Clés d'Item : colonnes simples + les relations (link_meta, item_files, task_details).
const ITEM_KEYS = [...ITEM_FIELDS.split(", "), "link_meta", "item_files", "task_details"] as (keyof Item)[];

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

/** Lien attaché à un élément (Docs, Prompts, Skills). */
export type RelatedLink = {
  id: string;
  title: string;
  url: string | null;
  faviconUrl: string | null;
  siteName: string | null;
};

/** Relation item_links utilisée pour les liens attachés. */
export const LINK_RELATION = "link";

/** Liens attachés à un item, dans l'ordre d'ajout. */
export async function getRelatedLinks(itemId: string): Promise<RelatedLink[]> {
  if (!itemIdSchema.safeParse(itemId).success) return [];
  const workspaceId = await getActiveWorkspaceId();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("item_links")
    .select(
      "created_at, target:items!item_links_to_item_workspace_id_fkey(id, title, url, link_meta(favicon_url, site_name))",
    )
    .eq("workspace_id", workspaceId)
    .eq("from_item", itemId)
    .eq("relation", LINK_RELATION)
    .order("created_at", { ascending: true });
  if (error) throw new Error("Impossible de charger les liens");
  return data.flatMap(({ target }) =>
    target
      ? [
          {
            id: target.id,
            title: target.title,
            url: target.url,
            faviconUrl: target.link_meta?.favicon_url ?? null,
            siteName: target.link_meta?.site_name ?? null,
          },
        ]
      : [],
  );
}

/** Tâche placée sur le calendrier. */
export type DatedTask = { id: string; title: string; status: TaskStatus; dueDate: string };

/** Tâches non archivées qui ont une échéance (calendrier). */
export async function listDatedTasks(limit = 2000): Promise<DatedTask[]> {
  const workspaceId = await getActiveWorkspaceId();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("task_details")
    .select("status, due_date, item:items!task_details_item_id_workspace_id_fkey!inner(id, title, archived)")
    .eq("workspace_id", workspaceId)
    .not("due_date", "is", null)
    .eq("item.archived", false)
    .order("due_date", { ascending: true })
    .limit(limit);
  if (error) throw new Error("Impossible de charger les tâches");
  return data.flatMap((row) =>
    row.item && row.due_date
      ? [{ id: row.item.id, title: row.item.title, status: row.status, dueDate: row.due_date }]
      : [],
  );
}
