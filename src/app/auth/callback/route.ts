import { type NextRequest, NextResponse } from "next/server";
import { LOGIN_PATH, safeNextPath } from "@/features/auth";
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
  }

  return NextResponse.redirect(new URL(`${LOGIN_PATH}?error=callback`, request.url));
}
