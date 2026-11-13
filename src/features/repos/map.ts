import { z } from "zod";

/** État de CI résumé (dernier run sur la branche par défaut). */
export const CI_STATES = ["success", "failure", "running", "cancelled", "none"] as const;
export type CiState = (typeof CI_STATES)[number];

export const CI_LABELS: Record<CiState, string> = {
  success: "CI réussie",
  failure: "CI en échec",
  running: "CI en cours",
  cancelled: "CI annulée",
  none: "Pas de CI",
};

export type PullState = "open" | "draft" | "merged" | "closed";

export const PULL_LABELS: Record<PullState, string> = {
  open: "Ouverte",
  draft: "Brouillon",
  merged: "Fusionnée",
  closed: "Fermée",
};

/** Ce qui est enregistré dans repo_activity.snapshot et affiché. */
export type RepoSnapshot = {
  repo: {
    fullName: string;
    description: string | null;
    stars: number;
    forks: number;
    defaultBranch: string;
    pushedAt: string | null;
    url: string;
    private: boolean;
  };
  ci: { state: CiState; workflow: string | null; branch: string | null; url: string | null; updatedAt: string | null };
  pulls: { number: number; title: string; state: PullState; author: string | null; url: string; updatedAt: string; ci: CiState | null }[];
  openPullCount: number;
  commits: { sha: string; message: string; author: string | null; url: string; date: string | null }[];
  issues: { number: number; title: string; author: string | null; url: string; updatedAt: string }[];
};

// ─────────────── Réponses de l'API GitHub (champs utilisés seulement) ───────────────

const user = z.object({ login: z.string() }).nullable().optional();
const httpsUrl = z.url().refine((value) => value.startsWith("https://"), "URL https attendue");

export const repoSchema = z.object({
  full_name: z.string(),
  description: z.string().nullable(),
  stargazers_count: z.number(),
  forks_count: z.number(),
  default_branch: z.string(),
  pushed_at: z.string().nullable(),
  html_url: httpsUrl,
  private: z.boolean(),
});

export const commitsSchema = z.array(
  z.object({
    sha: z.string(),
    html_url: httpsUrl,
    commit: z.object({
      message: z.string(),
      author: z.object({ name: z.string().nullable().optional(), date: z.string().nullable().optional() }).nullable(),
    }),
    author: user,
  }),
);

export const pullsSchema = z.array(
  z.object({
    number: z.number(),
    title: z.string(),
    state: z.enum(["open", "closed"]),
    draft: z.boolean().optional(),
    merged_at: z.string().nullable(),
    html_url: httpsUrl,
    updated_at: z.string(),
    user,
    head: z.object({ sha: z.string() }),
  }),
);

export const runsSchema = z.object({
  workflow_runs: z.array(
    z.object({
      name: z.string().nullable(),
      head_branch: z.string().nullable(),
      head_sha: z.string(),
      status: z.string().nullable(),
      conclusion: z.string().nullable(),
      html_url: httpsUrl,
      updated_at: z.string(),
    }),
  ),
});

export const issuesSchema = z.array(
  z.object({
    number: z.number(),
    title: z.string(),
    html_url: httpsUrl,
    updated_at: z.string(),
    user,
    // Les PR apparaissent aussi dans /issues : elles ont ce champ.
    pull_request: z.unknown().optional(),
  }),
);

type Run = z.infer<typeof runsSchema>["workflow_runs"][number];

/** État résumé d'un run GitHub Actions. */
export function ciStateOfRun(run: Pick<Run, "status" | "conclusion"> | undefined): CiState {
  if (!run) return "none";
  if (run.status !== "completed") return "running";
  switch (run.conclusion) {
    case "success":
    case "neutral":
      return "success";
    case "cancelled":
      return "cancelled";
    case "skipped":
    case null:
      return "none";
    default:
      // failure, timed_out, startup_failure, action_required…
      return "failure";
  }
}

const truncate = (text: string, max: number) => (text.length > max ? `${text.slice(0, max - 1).trimEnd()}…` : text);

/** Construit le résumé affiché à partir des réponses validées. */
export function buildSnapshot(input: {
  repo: z.infer<typeof repoSchema>;
  commits: z.infer<typeof commitsSchema>;
  pulls: z.infer<typeof pullsSchema>;
  runs: z.infer<typeof runsSchema>;
  issues: z.infer<typeof issuesSchema>;
  openPullCount: number;
}): RepoSnapshot {
  const { repo, commits, pulls, runs, issues, openPullCount } = input;
  // Runs du plus récent au plus ancien (ordre de l'API).
  const defaultRun = runs.workflow_runs.find((run) => run.head_branch === repo.default_branch);
  const runForSha = (sha: string) => runs.workflow_runs.find((run) => run.head_sha === sha);

  return {
    repo: {
      fullName: repo.full_name,
      description: repo.description ? truncate(repo.description, 300) : null,
      stars: repo.stargazers_count,
      forks: repo.forks_count,
      defaultBranch: repo.default_branch,
      pushedAt: repo.pushed_at,
      url: repo.html_url,
      private: repo.private,
    },
    ci: {
      state: ciStateOfRun(defaultRun),
      workflow: defaultRun?.name ?? null,
      branch: defaultRun?.head_branch ?? null,
      url: defaultRun?.html_url ?? null,
      updatedAt: defaultRun?.updated_at ?? null,
    },
    pulls: pulls.slice(0, 8).map((pull) => {
      const run = runForSha(pull.head.sha);
      return {
        number: pull.number,
        title: truncate(pull.title, 200),
        state: pull.merged_at ? "merged" : pull.state === "closed" ? "closed" : pull.draft ? "draft" : "open",
        author: pull.user?.login ?? null,
        url: pull.html_url,
        updatedAt: pull.updated_at,
        ci: run ? ciStateOfRun(run) : null,
      };
    }),
    openPullCount,
    commits: commits.slice(0, 8).map((commit) => ({
      sha: commit.sha.slice(0, 7),
      message: truncate(commit.commit.message.split("\n")[0] ?? "", 200),
      author: commit.author?.login ?? commit.commit.author?.name ?? null,
      url: commit.html_url,
      date: commit.commit.author?.date ?? null,
    })),
    issues: issues
      .filter((issue) => issue.pull_request === undefined)
      .slice(0, 5)
      .map((issue) => ({
        number: issue.number,
        title: truncate(issue.title, 200),
        author: issue.user?.login ?? null,
        url: issue.html_url,
        updatedAt: issue.updated_at,
      })),
  };
}

/** Nombre total d'éléments d'une liste paginée par 1, d'après l'en-tête Link. */
export function countFromLinkHeader(link: string | null, firstPageLength: number): number {
  const last = link?.match(/[?&]page=(\d+)[^>]*>;\s*rel="last"/)?.[1];
  return last ? Number(last) : firstPageLength;
}
