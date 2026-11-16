import { getActiveWorkspaceId } from "@/features/workspace";
import { repoFromHref } from "@/lib/repo";
import { createClient } from "@/lib/supabase/server";
import type { TablesUpdate } from "@/lib/supabase/database.types";
import { fetchRepoActivity, GithubError } from "./github";

/** Au-delà, l'activité est récupérée de nouveau à l'ouverture du repo. */
export const STALE_AFTER_MS = 10 * 60 * 1000;

export type RefreshRepoResult =
  | { ok: true; refreshed: boolean; error: string | null }
  | { ok: false; status: 400 | 404 | 500; error: string };

type Values = Pick<TablesUpdate<"repo_activity">, "ci_state" | "open_pr_count" | "snapshot" | "fetched_at" | "fetch_error">;

/**
 * Récupère l'activité GitHub d'un repo du workspace actif et la met en
 * cache. Sans `force`, ne rappelle pas GitHub si le cache a moins de 10 min.
 */
export async function refreshRepoActivity(itemId: string, force: boolean): Promise<RefreshRepoResult> {
  const workspaceId = await getActiveWorkspaceId();
  const supabase = await createClient();
  const { data: item } = await supabase
    .from("items")
    .select("id, type, url, repo_activity(fetched_at, snapshot)")
    .eq("workspace_id", workspaceId)
    .eq("id", itemId)
    .maybeSingle();
  if (!item || item.type !== "repo") return { ok: false, status: 404, error: "Repo introuvable" };
  const repo = item.url ? repoFromHref(item.url) : null;
  if (!repo) return { ok: false, status: 400, error: "Ce repo n'a pas d'URL de dépôt" };

  const cachedName = (item.repo_activity?.snapshot as { repo?: { fullName?: string } } | null)?.repo?.fullName;
  // Cache d'un autre dépôt (URL modifiée) : jamais réutilisé.
  const sameRepo = !cachedName || cachedName.toLowerCase() === `${repo.owner}/${repo.name}`.toLowerCase();
  const lastFetch = item.repo_activity?.fetched_at;
  if (!force && sameRepo && lastFetch && Date.now() - new Date(lastFetch).getTime() < STALE_AFTER_MS) {
    return { ok: true, refreshed: false, error: null };
  }

  let values: Values;
  let fetchError: string | null = null;
  try {
    const snapshot = await fetchRepoActivity(repo);
    values = {
      snapshot,
      ci_state: snapshot.ci.state,
      open_pr_count: snapshot.openPullCount,
      fetched_at: new Date().toISOString(),
      fetch_error: null,
    };
  } catch (error) {
    fetchError = error instanceof GithubError ? error.message : "Activité GitHub indisponible.";
    // Même dépôt : on garde le dernier snapshot réussi. Autre dépôt : on l'efface.
    values = sameRepo
      ? { fetched_at: new Date().toISOString(), fetch_error: fetchError }
      : { fetched_at: new Date().toISOString(), fetch_error: fetchError, snapshot: {}, ci_state: null, open_pr_count: null };
  }

  const { data: updated, error } = await supabase
    .from("repo_activity")
    .update(values)
    .eq("workspace_id", workspaceId)
    .eq("item_id", item.id)
    .select("item_id");
  if (error) return { ok: false, status: 500, error: "Enregistrement impossible" };
  if (updated.length === 0) {
    const { error: insertError } = await supabase
      .from("repo_activity")
      .insert({ ...values, item_id: item.id, workspace_id: workspaceId });
    if (insertError) return { ok: false, status: 500, error: "Enregistrement impossible" };
  }
  return { ok: true, refreshed: true, error: fetchError };
}
