import { refreshRepoActivity } from "@/features/repos";

/**
 * Rafraîchit l'activité GitHub d'un repo (?force=1 : ignore le cache de
 * 10 min). Route plutôt qu'action serveur : GitHub peut être lent, et les
 * actions serveur s'exécutent une à une.
 */
export async function POST(request: Request, { params }: RouteContext<"/api/items/[id]/github">) {
  const { id } = await params;
  const force = new URL(request.url).searchParams.get("force") === "1";
  const result = await refreshRepoActivity(id, force);
  if (!result.ok) return Response.json({ error: result.error }, { status: result.status });
  return Response.json({ refreshed: result.refreshed, error: result.error });
}
