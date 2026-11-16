import { type NextRequest, NextResponse } from "next/server";
import { LOGIN_PATH, logUnknownAuthError, safeNextPath } from "@/features/auth";
import { createClient } from "@/lib/supabase/server";

/** Retour OAuth GitHub et liens de confirmation d'e-mail (flux PKCE). */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const code = searchParams.get("code");
  const next = safeNextPath(searchParams.get("next"));

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(new URL(next, request.url));
    logUnknownAuthError("retour de connexion", error);
  } else if (searchParams.get("error")) {
    // Refus renvoyé par Supabase ou GitHub (lien expiré, fournisseur désactivé…).
    logUnknownAuthError("retour de connexion", {
      code: searchParams.get("error_code") ?? searchParams.get("error") ?? undefined,
      message: searchParams.get("error_description") ?? undefined,
    });
  }

  return NextResponse.redirect(new URL(`${LOGIN_PATH}?error=callback`, request.url));
}
