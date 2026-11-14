import { signedPhotoUrl } from "@/features/profile";

/** Photo de profil de l'utilisateur connecté : redirige vers une URL signée de 60 s. */
export async function GET() {
  const url = await signedPhotoUrl();
  if (!url) return new Response("Pas de photo", { status: 404 });
  return Response.redirect(url, 302);
}
