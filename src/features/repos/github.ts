// Côté serveur uniquement : utilise le jeton GitHub.
import { githubToken } from "@/lib/server-env";
import type { RepoRef } from "@/lib/repo";
import { buildSnapshot, commitsSchema, countFromLinkHeader, issuesSchema, pullsSchema, repoSchema, type RepoSnapshot, runsSchema } from "./map";
import type { z } from "zod";

const API = "https://api.github.com";
const TIMEOUT_MS = 8_000;
// Noms GitHub : lettres, chiffres, « - », « _ », « . » (jamais de « / » ni « .. »).
const SEGMENT = /^(?!\.\.?$)[A-Za-z0-9_.-]{1,100}$/;

export class GithubError extends Error {}

const timeFormat = new Intl.DateTimeFormat("fr", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Paris" });

async function call(path: string, signal: AbortSignal, allowNotFound = false): Promise<Response | null> {
  const token = githubToken();
  const response = await fetch(`${API}${path}`, {
    headers: {
      accept: "application/vnd.github+json",
      "x-github-api-version": "2022-11-28",
      "user-agent": "MyDash",
      ...(token ? { authorization: `Bearer ${token}` } : {}),
    },
    signal,
    cache: "no-store",
  });
  if (response.ok) return response;
  if (response.status === 404 && allowNotFound) return null;

  const remaining = response.headers.get("x-ratelimit-remaining");
  if ((response.status === 403 || response.status === 429) && remaining === "0") {
    const reset = Number(response.headers.get("x-ratelimit-reset"));
    const when = Number.isFinite(reset) && reset > 0 ? ` (réessaie après ${timeFormat.format(new Date(reset * 1000))})` : "";
    throw new GithubError(
      `Limite de l'API GitHub atteinte${when}.${token ? "" : " Un jeton GITHUB_TOKEN la relève."}`,
    );
  }
  if (response.status === 404) {
    throw new GithubError(token ? "Dépôt introuvable ou inaccessible avec ce jeton." : "Dépôt introuvable, ou privé (ajoute un jeton GITHUB_TOKEN).");
  }
  if (response.status === 401) throw new GithubError("Jeton GitHub refusé : vérifie GITHUB_TOKEN.");
  throw new GithubError(`GitHub répond ${response.status}.`);
}

async function json<T extends z.ZodType>(
  path: string,
  schema: T,
  signal: AbortSignal,
  ifNotFound?: z.infer<T>,
): Promise<z.infer<T>> {
  const response = await call(path, signal, ifNotFound !== undefined);
  if (!response) return ifNotFound as z.infer<T>;
  const parsed = schema.safeParse(await response.json());
  if (!parsed.success) throw new GithubError("Réponse inattendue de GitHub.");
  return parsed.data;
}

/** Activité d'un dépôt GitHub : dépôt, CI, PR, commits, issues (6 requêtes). */
export async function fetchRepoActivity(repo: RepoRef): Promise<RepoSnapshot> {
  if (repo.provider !== "github") throw new GithubError("Suivi disponible pour GitHub uniquement pour l'instant.");
  if (!SEGMENT.test(repo.owner) || !SEGMENT.test(repo.name)) throw new GithubError("Nom de dépôt invalide.");
  const base = `/repos/${encodeURIComponent(repo.owner)}/${encodeURIComponent(repo.name)}`;
  const signal = AbortSignal.timeout(TIMEOUT_MS);

  try {
    const info = await json(base, repoSchema, signal);
    const [commits, pulls, runs, issues, openPulls] = await Promise.all([
      json(`${base}/commits?per_page=8`, commitsSchema, signal),
      json(`${base}/pulls?state=all&sort=updated&direction=desc&per_page=10`, pullsSchema, signal),
      // Actions désactivées sur le dépôt (404) : pas de CI, pas une erreur.
      json(`${base}/actions/runs?per_page=30`, runsSchema, signal, { workflow_runs: [] }),
      json(`${base}/issues?state=open&sort=updated&direction=desc&per_page=10`, issuesSchema, signal),
      call(`${base}/pulls?state=open&per_page=1`, signal).then(async (response) =>
        response ? countFromLinkHeader(response.headers.get("link"), ((await response.json()) as unknown[]).length) : 0,
      ),
    ]);
    return buildSnapshot({ repo: info, commits, pulls, runs, issues, openPullCount: openPulls });
  } catch (error) {
    if (error instanceof GithubError) throw error;
    if (signal.aborted) throw new GithubError("GitHub met trop de temps à répondre.");
    throw new GithubError("GitHub injoignable.");
  }
}
