import { z } from "zod";
import { getActiveWorkspaceId } from "@/features/workspace";
import { createClient } from "@/lib/supabase/server";
import { type Space, SPACE_COLUMNS } from "./schemas";

export async function listSpaces(): Promise<Space[]> {
  const workspaceId = await getActiveWorkspaceId();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("spaces")
    .select(SPACE_COLUMNS)
    .eq("workspace_id", workspaceId)
    .order("position")
    .order("name");
  if (error) throw new Error("Impossible de charger les Espaces");
  return data;
}

export async function getSpace(id: string): Promise<Space | null> {
  if (!z.uuid().safeParse(id).success) return null;
  const workspaceId = await getActiveWorkspaceId();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("spaces")
    .select(SPACE_COLUMNS)
    .eq("workspace_id", workspaceId)
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error("Impossible de charger l'Espace");
  return data;
}

export async function getItemSpaces(itemId: string): Promise<Space[]> {
  const workspaceId = await getActiveWorkspaceId();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("item_spaces")
    .select(`spaces (${SPACE_COLUMNS})`)
    .eq("workspace_id", workspaceId)
    .eq("item_id", itemId);
  if (error) throw new Error("Impossible de charger les Espaces");
  return data
    .flatMap((row) => (row.spaces ? [row.spaces] : []))
    .sort((a, b) => a.position - b.position || a.name.localeCompare(b.name, "fr"));
}
