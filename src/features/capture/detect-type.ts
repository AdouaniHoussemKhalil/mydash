import type { ItemType } from "@/features/shell";
import { parseRepo, type RepoRef, repoUrl } from "@/lib/repo";
import { parseUrl, urlTitle } from "@/lib/url";

export { parseRepo, parseUrl, type RepoRef };


export type Capture =
  | { type: "link"; title: string; body: string; url: string }
  | { type: "repo"; title: string; body: string; url: string; repo: RepoRef }
  | { type: "note"; title: string; body: string };

const TITLE_MAX = 500;



function truncate(text: string, max = TITLE_MAX) {
  return text.length > max ? `${text.slice(0, max - 1).trimEnd()}…` : text;
}

/**
 * Champ unique de la palette : URL de dépôt → repo, autre URL → lien,
 * texte → note (première ligne = titre, le reste = contenu).
 */
export function detectCapture(input: string): Capture | null {
  const value = input.trim();
  if (!value) return null;

  const url = parseUrl(value);
  if (url) {
    const href = url.toString();
    const repo = parseRepo(url);
    if (repo) return { type: "repo", title: `${repo.owner}/${repo.name}`, body: "", url: repoUrl(repo), repo };
    return { type: "link", title: urlTitle(url, TITLE_MAX), body: "", url: href };
  }

  const [firstLine = "", ...rest] = value.split(/\r?\n/);
  return { type: "note", title: truncate(firstLine.trim()), body: rest.join("\n").trim() };
}

export const CAPTURE_TYPES = ["link", "repo", "note"] as const satisfies readonly ItemType[];
