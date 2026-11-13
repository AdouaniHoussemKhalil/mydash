export type RepoRef = { provider: "github" | "gitlab"; owner: string; name: string };

/** Segments GitHub qui ne sont pas des comptes (github.com/settings…). */
const GITHUB_RESERVED = new Set([
  "about", "apps", "collections", "explore", "features", "issues", "login", "marketplace",
  "notifications", "orgs", "pricing", "pulls", "search", "settings", "sponsors", "topics", "trending",
]);

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

/** URL canonique du dépôt (sans .git, ni onglet, ni branche). */
export function repoUrl(repo: RepoRef): string {
  const host = repo.provider === "github" ? "github.com" : "gitlab.com";
  return `https://${host}/${repo.owner}/${repo.name}`;
}

export const REPO_PROVIDER_LABELS: Record<RepoRef["provider"], string> = { github: "GitHub", gitlab: "GitLab" };

/** Dépôt désigné par une URL (chaîne), ou null. */
export function repoFromHref(href: string): RepoRef | null {
  try {
    return parseRepo(new URL(href));
  } catch {
    return null;
  }
}
