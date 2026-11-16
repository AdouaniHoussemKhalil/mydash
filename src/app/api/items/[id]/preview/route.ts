import { refreshLinkPreview } from "@/features/items/link-preview/refresh";

/**
 * Récupère et enregistre l'aperçu d'un lien (titre, description, image,
 * favicon). Route plutôt qu'action serveur : une page lente ne bloque pas
 * les autres actions (enregistrement automatique), exécutées une à une.
 */
export async function POST(_request: Request, { params }: RouteContext<"/api/items/[id]/preview">) {
  const { id } = await params;
  const result = await refreshLinkPreview(id);
  if (!result.ok) return Response.json({ error: result.error }, { status: result.status });
  return Response.json({ preview: result.preview, titleUpdated: result.titleUpdated, error: result.error });
}
