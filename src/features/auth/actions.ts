"use server";

import { redirect } from "next/navigation";
import { publicEnv } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import { authErrorMessage } from "./errors";
import { HOME_PATH, LOGIN_PATH, safeNextPath } from "./paths";
import { authModeSchema, credentialsSchema } from "./schemas";

export type AuthActionResult = { ok: false; error: string } | { ok: true; message: string };

function callbackUrl(next: string) {
  const url = new URL("/auth/callback", publicEnv().NEXT_PUBLIC_SITE_URL);
  url.searchParams.set("next", safeNextPath(next));
  return url.toString();
}

/** Connexion ou inscription par e-mail + mot de passe. */
export async function authenticateWithPassword(
  mode: unknown,
  input: unknown,
  next: unknown,
): Promise<AuthActionResult> {
  const parsedMode = authModeSchema.safeParse(mode);
  const parsed = credentialsSchema.safeParse(input);
  if (!parsedMode.success || !parsed.success) {
    return { ok: false, error: "Vérifie l'e-mail et le mot de passe." };
  }
  const nextPath = safeNextPath(typeof next === "string" ? next : null);
  const supabase = await createClient();

  if (parsedMode.data === "sign-in") {
    const { error } = await supabase.auth.signInWithPassword(parsed.data);
    if (error) return { ok: false, error: authErrorMessage(error.code) };
    redirect(nextPath);
  }

  const { data, error } = await supabase.auth.signUp({
    ...parsed.data,
    options: { emailRedirectTo: callbackUrl(nextPath) },
  });
  if (error) return { ok: false, error: authErrorMessage(error.code) };
  // Confirmation d'e-mail désactivée : la session existe déjà.
  if (data.session) redirect(nextPath);
  return { ok: true, message: "Compte créé. Ouvre le lien reçu par e-mail pour l'activer." };
}

/** Démarre le flux OAuth GitHub (PKCE) puis redirige vers GitHub. */
export async function signInWithGitHub(formData: FormData): Promise<void> {
  const next = formData.get("next");
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "github",
    options: {
      redirectTo: callbackUrl(typeof next === "string" ? next : HOME_PATH),
      scopes: "read:user user:email",
    },
  });
  if (error || !data.url) redirect(`${LOGIN_PATH}?error=oauth`);
  redirect(data.url);
}

export async function signOut(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect(LOGIN_PATH);
}
