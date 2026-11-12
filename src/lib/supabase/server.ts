import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { connection } from "next/server";
import { publicEnv } from "@/lib/env";
import type { Database } from "./database.types";

/**
 * Client Supabase côté serveur (Server Components, Server Actions, Route
 * Handlers). Agit avec la session de l'utilisateur : la RLS s'applique.
 * À créer à chaque requête, jamais en variable globale.
 */
export async function createClient() {
  // Toujours à la requête : supabase-js lit l'heure (expiration du JWT),
  // ce que Cache Components interdit pendant un prérendu.
  await connection();
  const cookieStore = await cookies();
  const env = publicEnv();

  return createServerClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            for (const { name, value, options } of cookiesToSet) {
              cookieStore.set(name, value, options);
            }
          } catch {
            // Appelé depuis un Server Component : écriture impossible, le
            // proxy rafraîchit déjà la session à chaque requête.
          }
        },
      },
    },
  );
}
