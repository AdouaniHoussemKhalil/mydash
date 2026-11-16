import { connection } from "next/server";

/**
 * Health check de l'hébergeur (Render) : l'app répond. Public (voir
 * HEALTH_PATH), sans donnée sensible ni appel à la base, pour qu'un
 * incident Supabase ne fasse pas redémarrer l'app en boucle.
 */
export async function GET() {
  await connection();
  return Response.json(
    { status: "ok", time: new Date().toISOString() },
    { headers: { "cache-control": "no-store" } },
  );
}
