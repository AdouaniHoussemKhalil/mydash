import { signedFileUrl } from "@/features/files";

/**
 * Lien stable vers un fichier : redirige vers une URL signée de 60 s
 * (?download=1 : téléchargement sous le nom d'origine). Les droits sont
 * ceux de l'utilisateur connecté (RLS et règles Storage).
 */
export async function GET(request: Request, { params }: RouteContext<"/api/files/[id]">) {
  const { id } = await params;
  const download = new URL(request.url).searchParams.get("download") === "1";
  const url = await signedFileUrl(id, download);
  if (!url) return new Response("Fichier introuvable", { status: 404 });
  return Response.redirect(url, 302);
}
