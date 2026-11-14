"use server";

import { refresh } from "next/cache";
import { getCurrentUser } from "@/features/auth";
import { type ActionResult, firstIssue } from "@/lib/action-result";
import { createClient } from "@/lib/supabase/server";
import { PHOTO_BUCKET, PHOTO_TYPES, photoInfoSchema, profilePatchSchema } from "./schemas";

/** Modifie un ou plusieurs champs de l'identité. */
export async function updateProfile(patch: unknown): Promise<ActionResult<{ updated_at: string }>> {
  const parsed = profilePatchSchema.safeParse(patch);
  if (!parsed.success) return { ok: false, error: firstIssue(parsed.error) };

  const user = await getCurrentUser();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .update(parsed.data)
    .eq("user_id", user.id)
    .select("updated_at")
    .maybeSingle();
  if (error || !data) return { ok: false, error: "Enregistrement impossible. Réessaie." };

  refresh();
  return { ok: true, data };
}

/** Étape 1 : URL d'envoi signée pour une nouvelle photo (dossier de l'utilisateur). */
export async function preparePhotoUpload(info: unknown): Promise<ActionResult<{ path: string; signedUrl: string }>> {
  const parsed = photoInfoSchema.safeParse(info);
  if (!parsed.success) return { ok: false, error: firstIssue(parsed.error) };

  const user = await getCurrentUser();
  const supabase = await createClient();
  const path = `${user.id}/${crypto.randomUUID()}.${PHOTO_TYPES[parsed.data.mimeType]}`;
  const { data, error } = await supabase.storage.from(PHOTO_BUCKET).createSignedUploadUrl(path);
  if (error || !data) return { ok: false, error: "Envoi impossible. Réessaie." };
  return { ok: true, data: { path, signedUrl: data.signedUrl } };
}

/** Étape 2 : enregistre la photo envoyée et supprime l'ancienne. */
export async function setProfilePhoto(path: unknown): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (typeof path !== "string" || !new RegExp(`^${user.id}/[0-9a-f-]{36}[.](jpg|png|webp)$`).test(path)) {
    return { ok: false, error: "Photo invalide" };
  }
  const supabase = await createClient();
  const { data: stored } = await supabase.storage.from(PHOTO_BUCKET).list(user.id, { search: path.split("/")[1] ?? "" });
  if (!stored?.some((object) => `${user.id}/${object.name}` === path)) {
    return { ok: false, error: "Photo non reçue. Réessaie." };
  }

  const { data: previous } = await supabase.from("profiles").select("photo_path").eq("user_id", user.id).maybeSingle();
  const { error } = await supabase.from("profiles").update({ photo_path: path }).eq("user_id", user.id);
  if (error) return { ok: false, error: "Enregistrement impossible. Réessaie." };
  if (previous?.photo_path && previous.photo_path !== path) {
    await supabase.storage.from(PHOTO_BUCKET).remove([previous.photo_path]);
  }

  refresh();
  return { ok: true, data: undefined };
}

/** Retire la photo de profil. */
export async function removeProfilePhoto(): Promise<ActionResult> {
  const user = await getCurrentUser();
  const supabase = await createClient();
  const { data: profile } = await supabase.from("profiles").select("photo_path").eq("user_id", user.id).maybeSingle();
  const { error } = await supabase.from("profiles").update({ photo_path: null }).eq("user_id", user.id);
  if (error) return { ok: false, error: "Suppression impossible. Réessaie." };
  if (profile?.photo_path) await supabase.storage.from(PHOTO_BUCKET).remove([profile.photo_path]);

  refresh();
  return { ok: true, data: undefined };
}
