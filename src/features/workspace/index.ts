import { cache } from "react";
import { getCurrentUser } from "@/features/auth";
import { createClient } from "@/lib/supabase/server";

/**
 * Workspace actif. MVP : le workspace personnel. Quand le partage
 * arrivera, ce choix viendra d'un sélecteur (cookie), sans toucher aux appelants.
 * Vérifie la session (redirige vers /login sinon).
 */
export const getActiveWorkspaceId = cache(async (): Promise<string> => {
  const user = await getCurrentUser();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("workspaces")
    .select("id")
    .eq("is_personal", true)
    .eq("created_by", user.id)
    .single();
  if (error || !data) throw new Error("Workspace personnel introuvable");
  return data.id;
});
