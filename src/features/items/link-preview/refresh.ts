import { createClient } from "@/lib/supabase/server";
import { urlTitle } from "@/lib/url";
import { writeLinkMeta } from "../link-meta";
import { getActiveWorkspaceId, getItem } from "../queries";
import { TITLE_MAX } from "../schemas";
import { fetchLinkPreview, PreviewError } from "./fetch";
import type { LinkPreview } from "./parse";

export type RefreshPreviewResult =
  | { ok: true; preview: LinkPreview; titleUpdated: boolean; error: string | null }
  | { ok: false; status: 400 | 404 | 500; error: string };

const EMPTY: LinkPreview = { pageTitle: null, description: null, siteName: null, imageUrl: null, faviconUrl: null };

/**
 * Récupère l'aperçu d'un lien du workspace actif et l'enregistre.
 * Le titre de l'item est remplacé par celui de la page seulement s'il
 * vaut encore le titre généré depuis l'URL (jamais un titre saisi).
 */
export async function refreshLinkPreview(itemId: string): Promise<RefreshPreviewResult> {
  const item = await getItem(itemId);
  if (!item || item.type !== "link") return { ok: false, status: 404, error: "Lien introuvable" };
  if (!item.url) return { ok: false, status: 400, error: "Ce lien n'a pas d'URL" };

  let preview = EMPTY;
  let fetchError: string | null = null;
  try {
    preview = await fetchLinkPreview(item.url);
  } catch (error) {
    fetchError = error instanceof PreviewError ? error.message : "Aperçu impossible";
  }

  const workspaceId = await getActiveWorkspaceId();
  const supabase = await createClient();
  const written = await writeLinkMeta(supabase, workspaceId, item.id, {
    page_title: preview.pageTitle,
    description: preview.description,
    site_name: preview.siteName,
    image_url: preview.imageUrl,
    favicon_url: preview.faviconUrl,
    fetched_at: new Date().toISOString(),
    fetch_error: fetchError,
  });
  if (!written) return { ok: false, status: 500, error: "Enregistrement de l'aperçu impossible" };
  // Page injoignable : résultat normal (enregistré), pas une erreur de requête.
  if (fetchError) return { ok: true, preview, titleUpdated: false, error: fetchError };

  let titleUpdated = false;
  const pageTitle = preview.pageTitle?.slice(0, TITLE_MAX);
  if (pageTitle && pageTitle !== item.title && item.title === urlTitle(new URL(item.url))) {
    const { error } = await supabase
      .from("items")
      .update({ title: pageTitle })
      .eq("workspace_id", workspaceId)
      .eq("id", item.id);
    titleUpdated = !error;
  }

  return { ok: true, preview, titleUpdated, error: null };
}
