import type { ItemType } from "@/features/shell";

export type RepoRef = { provider: "github" | "gitlab"; owner: string; name: string };

export type Capture =
  | { type: "link"; title: string; body: string; url: string }
  | { type: "repo"; title: string; body: string; url: string; repo: RepoRef }
  | { type: "note"; title: string; body: string };

const TITLE_MAX = 500;

/** Segments GitHub qui ne sont pas des comptes (github.com/settings…). */
const GITHUB_RESERVED = new Set([
  "about", "apps", "collections", "explore", "features", "issues", "login", "marketplace",
  "notifications", "orgs", "pricing", "pulls", "search", "settings", "sponsors", "topics", "trending",
]);

/**
 * Extensions de fichier courantes : « README.md » ou « notes.txt » sans
 * schéma désignent un fichier, même si .md ou .py sont aussi des TLD.
 */
const FILE_EXTENSIONS = new Set([
  "txt", "md", "pdf", "doc", "docx", "xls", "xlsx", "csv", "json", "yaml", "yml", "xml", "html",
  "css", "js", "jsx", "ts", "tsx", "py", "rb", "go", "rs", "java", "sh", "sql", "png", "jpg",
  "jpeg", "gif", "svg", "webp", "zip", "tar", "gz", "log", "env", "lock", "toml",
]);

/**
 * Interprète une saisie comme une URL. Accepte « https://… » et les formes
 * courtes « www.exemple.com » ou « exemple.com/chemin » (sans espace).
 */
export function parseUrl(input: string): URL | null {
  const value = input.trim();
  if (!value || /\s/.test(value)) return null;

  let withScheme: string | null = null;
  if (/^https?:\/\//i.test(value)) {
    withScheme = value;
  } else {
    const bare = /^(www\.)?[a-z0-9-]+(\.[a-z0-9-]+)*\.([a-z]{2,})(:\d+)?([/?#]|$)/i.exec(value);
    const tld = bare?.[3]?.toLowerCase();
    const isFileName = !bare?.[1] && tld !== undefined && FILE_EXTENSIONS.has(tld) && !/[/?#]/.test(value);
    if (bare && !isFileName) withScheme = `https://${value}`;
  }
  if (!withScheme) return null;

  try {
    const url = new URL(withScheme);
    return url.hostname.includes(".") || url.hostname === "localhost" ? url : null;
  } catch {
    return null;
  }
}

/** github.com/owner/repo(/…) ou gitlab.com/group/project(/-/…) → dépôt. */
export function parseRepo(url: URL): RepoRef | null {
  const host = url.hostname.replace(/^www\./, "").toLowerCase();
  const segments = url.pathname.split("/").filter(Boolean);

  if (host === "github.com" && segments.length >= 2) {
    const [owner, rawName] = segments as [string, string];
    if (GITHUB_RESERVED.has(owner.toLowerCase())) return null;
    const name = rawName.replace(/\.git$/, "");
    return name ? { provider: "github", owner, name } : null;
  }

  if (host === "gitlab.com" && segments.length >= 2) {
    // Les sous-groupes sont permis ; « /-/ » sépare le projet des pages internes.
    const end = segments.indexOf("-");
    const path = (end === -1 ? segments : segments.slice(0, end)).map((s) => s.replace(/\.git$/, ""));
    if (path.length < 2) return null;
    return { provider: "gitlab", owner: path.slice(0, -1).join("/"), name: path.at(-1)! };
  }

  return null;
}

function truncate(text: string, max = TITLE_MAX) {
  return text.length > max ? `${text.slice(0, max - 1).trimEnd()}…` : text;
}

/** Titre lisible d'un lien en attendant les métadonnées (Phase 1). */
function linkTitle(url: URL) {
  const path = url.pathname === "/" ? "" : url.pathname.replace(/\/$/, "");
  return truncate(`${url.hostname.replace(/^www\./, "")}${decodeURIComponent(path)}`);
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
    if (repo) return { type: "repo", title: `${repo.owner}/${repo.name}`, body: href, url: href, repo };
    return { type: "link", title: linkTitle(url), body: href, url: href };
  }

  const [firstLine = "", ...rest] = value.split(/\r?\n/);
  return { type: "note", title: truncate(firstLine.trim()), body: rest.join("\n").trim() };
}

export const CAPTURE_TYPES = ["link", "repo", "note"] as const satisfies readonly ItemType[];
