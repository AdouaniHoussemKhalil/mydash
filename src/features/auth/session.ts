import { redirect } from "next/navigation";
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { LOGIN_PATH } from "./paths";

export type CurrentUser = {
  id: string;
  email: string | null;
};

/**
 * Data Access Layer : utilisateur courant, vérifié côté serveur (JWT
 * validé par getClaims). Redirige vers /login sans session.
 * Mémoïsé pour la durée d'une requête.
 */
export const getCurrentUser = cache(async (): Promise<CurrentUser> => {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  const claims = data?.claims;
  if (error || !claims?.sub) redirect(LOGIN_PATH);

  return {
    id: claims.sub,
    email: typeof claims.email === "string" ? claims.email : null,
  };
});
