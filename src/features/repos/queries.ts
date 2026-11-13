import { getActiveWorkspaceId } from "@/features/workspace";
import { createClient } from "@/lib/supabase/server";
import type { CiState, RepoSnapshot } from "./map";

export type RepoActivity = {
  snapshot: RepoSnapshot | null;
  ciState: CiState | null;
  fetchedAt: string | null;
  fetchError: string | null;
};

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Activité GitHub mise en cache pour un repo (null si jamais récupérée). */
export async function getRepoActivity(itemId: string): Promise<RepoActivity | null> {
  if (!UUID.test(itemId)) return null;
  const workspaceId = await getActiveWorkspaceId();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("repo_activity")
    .select("snapshot, ci_state, fetched_at, fetch_error")
    .eq("workspace_id", workspaceId)
    .eq("item_id", itemId)
    .maybeSingle();
  if (error) throw new Error("Impossible de charger l'activité du dépôt");
  if (!data) return null;
  const snapshot = data.snapshot as Partial<RepoSnapshot> | null;
  return {
    // Un snapshot vide ({}) = aucune récupération réussie.
    snapshot: snapshot && "repo" in snapshot ? (snapshot as RepoSnapshot) : null,
    ciState: data.ci_state as CiState | null,
    fetchedAt: data.fetched_at,
    fetchError: data.fetch_error,
  };
}
