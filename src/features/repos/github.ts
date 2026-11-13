// Côté serveur uniquement : utilise le jeton GitHub.
import type { z } from "zod";
import type { RepoRef } from "@/lib/repo";
import { githubToken } from "@/lib/server-env";
import {
  buildSnapshot,
  commitsSchema,
  countFromLinkHeader,
  issuesSchema,
  pullsSchema,
  repoSchema,
  type RepoSnapshot,
  runsSchema,
} from "./map";

const API = "https://api.github.com";
const TIMEOUT_MS = 8_000;
// Noms GitHub : lettres, chiffres, « - », « _ », « . » (jamais de « / » ni « .. »).
const SEGMENT = /^(?!\.\.?$)[A-Za-z0-9_.-]{1,100}$/;

export class GithubError extends Error {}

/** Réponse refusée faute de permission sur le jeton (section facultative). */
const DENIED = Symbol("denied");

const timeFormat = new Intl.DateTimeFormat("fr", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Paris" });

async function githubMessage(response: Response): Promise<string> {
  const body = (await response.json().catch(() => null)) as { message?: unknown } | null;
  return typeof body?.message === "string" ? body.message.slice(0, 150) : "";
}

type CallOptions = { allowNotFound?: boolean; optional?: boolean };

async function call(path: string, signal: AbortSignal, options: CallOptions = {}): Promise<Response | null | typeof DENIED> {
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
  if (response.status === 404 && options.allowNotFound) return null;

  if ((response.status === 403 || response.status === 429) && response.headers.get("x-ratelimit-remaining") === "0") {
    const reset = Number(response.headers.get("x-ratelimit-reset"));
    const when = Number.isFinite(reset) && reset > 0 ? ` (réessaie après ${timeFormat.format(new Date(reset * 1000))})` : "";
    throw new GithubError(`Limite de l'API GitHub atteinte${when}.${token ? "" : " Un jeton GITHUB_TOKEN la relève."}`);
  }
  // Permission absente sur le jeton : seule cette section est perdue.
  if (response.status === 403 && options.optional) return DENIED;
  if (response.status === 403) {
    const detail = await githubMessage(response);
    throw new GithubError(
      `Accès refusé par GitHub${detail ? ` (« ${detail} »)` : ""}. Vérifie que le jeton couvre ce dépôt (Repository access) avec la permission Metadata.`,
    );
  }
  if (response.status === 404) {
    throw new GithubError(
      token ? "Dépôt introuvable, ou non couvert par le jeton (Repository access)." : "Dépôt introuvable, ou privé (ajoute un jeton GITHUB_TOKEN).",
    );
  }
  if (response.status === 401) throw new GithubError("Jeton GitHub refusé (expiré ou invalide) : vérifie GITHUB_TOKEN.");
  throw new GithubError(`GitHub répond ${response.status}.`);
}

async function json<T extends z.ZodType>(
  path: string,
  schema: T,
  signal: AbortSignal,
  options: CallOptions & { ifNotFound?: z.infer<T> } = {},
): Promise<z.infer<T> | null> {
  const response = await call(path, signal, { ...options, allowNotFound: options.ifNotFound !== undefined });
  if (response === DENIED) return null;
  if (response === null) return options.ifNotFound as z.infer<T>;
  const parsed = schema.safeParse(await response.json());
  if (!parsed.success) throw new GithubError("Réponse inattendue de GitHub.");
  return parsed.data;
}

/**
 * Activité d'un dépôt GitHub : dépôt, CI, PR, commits, issues (6 requêtes).
 * Une section refusée (permission manquante) n'empêche pas les autres.
 */
export async function fetchRepoActivity(repo: RepoRef): Promise<RepoSnapshot> {
  if (repo.provider !== "github") throw new GithubError("Suivi disponible pour GitHub uniquement pour l'instant.");
  if (!SEGMENT.test(repo.owner) || !SEGMENT.test(repo.name)) throw new GithubError("Nom de dépôt invalide.");
  const base = `/repos/${encodeURIComponent(repo.owner)}/${encodeURIComponent(repo.name)}`;
  const signal = AbortSignal.timeout(TIMEOUT_MS);

  try {
    const info = await json(base, repoSchema, signal);
    if (!info) throw new GithubError("Dépôt inaccessible.");
    const optional = { optional: true } as const;
    const [commits, pulls, runs, issues, openPulls] = await Promise.all([
      json(`${base}/commits?per_page=8`, commitsSchema, signal, optional),
      json(`${base}/pulls?state=all&sort=updated&direction=desc&per_page=10`, pullsSchema, signal, optional),
      // Actions désactivées sur le dépôt (404) : pas de CI, pas une erreur.
      json(`${base}/actions/runs?per_page=30`, runsSchema, signal, { ...optional, ifNotFound: { workflow_runs: [] } }),
      json(`${base}/issues?state=open&sort=updated&direction=desc&per_page=10`, issuesSchema, signal, optional),
      call(`${base}/pulls?state=open&per_page=1`, signal, optional).then(async (response) =>
        response && response !== DENIED
          ? countFromLinkHeader(response.headers.get("link"), ((await response.json()) as unknown[]).length)
          : 0,
      ),
    ]);
    return buildSnapshot({ repo: info, commits, pulls, runs, issues, openPullCount: openPulls });
  } catch (error) {
    if (error instanceof GithubError) throw error;
    if (signal.aborted) throw new GithubError("GitHub met trop de temps à répondre.");
    throw new GithubError("GitHub injoignable.");
  }
}
