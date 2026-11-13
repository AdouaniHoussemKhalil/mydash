// Variables serveur uniquement (jamais NEXT_PUBLIC_ : non exposées au navigateur).

/**
 * Jeton GitHub facultatif (lecture seule) : dépôts privés et limite de
 * 5 000 requêtes/h au lieu de 60 sans jeton. Voir .env.example.
 */
export function githubToken(): string | null {
  const token = process.env.GITHUB_TOKEN?.trim();
  return token && !/\s/.test(token) ? token : null;
}
