import { getCurrentUser } from "@/features/auth";
import { createClient } from "@/lib/supabase/server";
import { PHOTO_BUCKET, type Profile, PROFILE_COLUMNS } from "./schemas";

/** Profil de l'utilisateur connecté (créé à l'inscription). */
export async function getProfile(): Promise<Profile> {
  const user = await getCurrentUser();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select(PROFILE_COLUMNS)
    .eq("user_id", user.id)
    .maybeSingle();
  if (error) throw new Error("Impossible de charger le profil");
  if (data) return data;
  // Filet de sécurité : profil absent (compte très ancien) → créé vide.
  const { data: created, error: insertError } = await supabase
    .from("profiles")
    .insert({ user_id: user.id })
    .select(PROFILE_COLUMNS)
    .single();
  if (insertError || !created) throw new Error("Impossible de créer le profil");
  return created;
}

/** URL signée courte (60 s) de la photo de profil, ou null. */
export async function signedPhotoUrl(): Promise<string | null> {
  const profile = await getProfile();
  if (!profile.photo_path) return null;
  const supabase = await createClient();
  const { data } = await supabase.storage.from(PHOTO_BUCKET).createSignedUrl(profile.photo_path, 60);
  return data?.signedUrl ?? null;
}
