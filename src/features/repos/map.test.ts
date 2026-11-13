import { describe, expect, it } from "vitest";
import { buildSnapshot, ciStateOfRun, commitsSchema, countFromLinkHeader, issuesSchema, pullsSchema, repoSchema, runsSchema } from "./map";

const repo = repoSchema.parse({
  full_name: "vercel/next.js",
  description: "The React Framework",
  stargazers_count: 130000,
  forks_count: 28000,
  default_branch: "canary",
  pushed_at: "2026-11-13T10:00:00Z",
  html_url: "https://github.com/vercel/next.js",
  private: false,
  extra: "ignoré",
});

const runs = runsSchema.parse({
  workflow_runs: [
    { name: "build", head_branch: "feature/x", head_sha: "pr1sha", status: "completed", conclusion: "failure", html_url: "https://github.com/r/1", updated_at: "2026-11-13T09:00:00Z" },
    { name: "build", head_branch: "canary", head_sha: "main1", status: "in_progress", conclusion: null, html_url: "https://github.com/r/2", updated_at: "2026-11-13T08:00:00Z" },
    { name: "build", head_branch: "canary", head_sha: "main0", status: "completed", conclusion: "success", html_url: "https://github.com/r/3", updated_at: "2026-11-12T08:00:00Z" },
  ],
});

const pulls = pullsSchema.parse([
  { number: 12, title: "Fix", state: "open", draft: false, merged_at: null, html_url: "https://github.com/p/12", updated_at: "2026-11-13T09:00:00Z", user: { login: "alice" }, head: { sha: "pr1sha" } },
  { number: 11, title: "WIP", state: "open", draft: true, merged_at: null, html_url: "https://github.com/p/11", updated_at: "2026-11-12T09:00:00Z", user: null, head: { sha: "x" } },
  { number: 10, title: "Feat", state: "closed", merged_at: "2026-11-11T00:00:00Z", html_url: "https://github.com/p/10", updated_at: "2026-11-11T00:00:00Z", user: { login: "bob" }, head: { sha: "y" } },
  { number: 9, title: "Old", state: "closed", merged_at: null, html_url: "https://github.com/p/9", updated_at: "2026-11-10T00:00:00Z", user: { login: "bob" }, head: { sha: "z" } },
]);

const commits = commitsSchema.parse([
  { sha: "abcdef1234567", html_url: "https://github.com/c/1", commit: { message: "feat: titre\n\ncorps", author: { name: "Alice", date: "2026-11-13T10:00:00Z" } }, author: { login: "alice" } },
  { sha: "1234567abcdef", html_url: "https://github.com/c/2", commit: { message: "fix: autre", author: { name: "Sans compte", date: null } }, author: null },
]);

const issues = issuesSchema.parse([
  { number: 5, title: "Bug", html_url: "https://github.com/i/5", updated_at: "2026-11-13T00:00:00Z", user: { login: "carol" } },
  { number: 12, title: "Fix", html_url: "https://github.com/p/12", updated_at: "2026-11-13T00:00:00Z", user: null, pull_request: {} },
]);

describe("ciStateOfRun", () => {
  it.each([
    [{ status: "completed", conclusion: "success" }, "success"],
    [{ status: "completed", conclusion: "failure" }, "failure"],
    [{ status: "completed", conclusion: "timed_out" }, "failure"],
    [{ status: "completed", conclusion: "cancelled" }, "cancelled"],
    [{ status: "queued", conclusion: null }, "running"],
    [{ status: "completed", conclusion: "skipped" }, "none"],
  ] as const)("%o → %s", (run, state) => {
    expect(ciStateOfRun(run)).toBe(state);
  });

  it("aucun run → none", () => {
    expect(ciStateOfRun(undefined)).toBe("none");
  });
});

describe("buildSnapshot", () => {
  const snapshot = buildSnapshot({ repo, commits, pulls, runs, issues, openPullCount: 2 });

  it("prend le dernier run de la branche par défaut pour la CI", () => {
    expect(snapshot.ci).toMatchObject({ state: "running", branch: "canary", url: "https://github.com/r/2" });
  });

  it("donne l'état de chaque PR et sa CI", () => {
    expect(snapshot.pulls.map((pull) => [pull.number, pull.state, pull.ci])).toEqual([
      [12, "open", "failure"],
      [11, "draft", null],
      [10, "merged", null],
      [9, "closed", null],
    ]);
  });

  it("résume les commits et retire les PR des issues", () => {
    expect(snapshot.commits[0]).toMatchObject({ sha: "abcdef1", message: "feat: titre", author: "alice" });
    expect(snapshot.commits[1]?.author).toBe("Sans compte");
    expect(snapshot.issues.map((issue) => issue.number)).toEqual([5]);
    expect(snapshot.repo).toMatchObject({ fullName: "vercel/next.js", defaultBranch: "canary", stars: 130000 });
  });
});

describe("validation des réponses", () => {
  it("refuse une URL non https venue de l'API", () => {
    expect(repoSchema.safeParse({ ...repo, html_url: "javascript:alert(1)" }).success).toBe(false);
  });
});

describe("countFromLinkHeader", () => {
  it("lit la dernière page de l'en-tête Link", () => {
    const link =
      '<https://api.github.com/repositories/1/pulls?state=open&per_page=1&page=2>; rel="next", <https://api.github.com/repositories/1/pulls?state=open&per_page=1&page=37>; rel="last"';
    expect(countFromLinkHeader(link, 1)).toBe(37);
    expect(countFromLinkHeader(null, 1)).toBe(1);
    expect(countFromLinkHeader(null, 0)).toBe(0);
  });
});
