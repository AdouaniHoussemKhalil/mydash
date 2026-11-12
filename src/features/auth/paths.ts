export const LOGIN_PATH = "/login";
/** Page d'arrivée après connexion. */
export const HOME_PATH = "/today";

/** Préfixes accessibles sans session. */
const PUBLIC_PREFIXES = [LOGIN_PATH, "/auth/"];

export function isPublicPath(pathname: string): boolean {
  return PUBLIC_PREFIXES.some((prefix) =>
    prefix.endsWith("/") ? pathname.startsWith(prefix) : pathname === prefix,
  );
}

/**
 * Chemin de redirection après connexion. N'accepte qu'un chemin interne
 * (« /… » mais pas « //… ») pour éviter les redirections ouvertes.
 * « / » mène directement à HOME_PATH (une redirection d'action serveur
 * ne suit pas les redirections de next.config).
 */
export function safeNextPath(next: string | null | undefined): string {
  if (!next || next === "/" || !next.startsWith("/") || next.startsWith("//") || next.startsWith("/\\")) {
    return HOME_PATH;
  }
  return next;
}
