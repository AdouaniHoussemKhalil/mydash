import { getActiveWorkspaceId } from "@/features/workspace";
import { createClient } from "@/lib/supabase/server";
import type { SharedClipboard } from "./schemas";

/** Texte du presse-papiers partagé de l'espace actif (vide s'il n'a jamais servi). */
export async function getSharedClipboard(): Promise<SharedClipboard> {
  const workspaceId = await getActiveWorkspaceId();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("shared_clipboard")
    .select("text, updated_at")
    .eq("workspace_id", workspaceId)
    .maybeSingle();
  if (error) throw new Error("Impossible de charger le presse-papiers");
  return { text: data?.text ?? "", updatedAt: data?.updated_at ?? null };
}
