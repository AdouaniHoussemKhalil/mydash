// @vitest-environment node
import { afterEach, describe, expect, it, vi } from "vitest";
import { fetchRepoActivity } from "./github";

const github = { provider: "github", owner: "vercel", name: "next.js" } as const;

function respond(status: number, body: unknown = {}, headers: Record<string, string> = {}) {
  return new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json", ...headers } });
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe("fetchRepoActivity : erreurs", () => {
  it("dépôt introuvable sans jeton : suggère GITHUB_TOKEN", async () => {
    vi.stubEnv("GITHUB_TOKEN", "");
    vi.stubGlobal("fetch", vi.fn(async () => respond(404, { message: "Not Found" })));
    await expect(fetchRepoActivity(github)).rejects.toThrow("Dépôt introuvable, ou privé (ajoute un jeton GITHUB_TOKEN).");
  });

  it("limite atteinte : message clair", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => respond(403, {}, { "x-ratelimit-remaining": "0", "x-ratelimit-reset": "1794600000" })),
    );
    await expect(fetchRepoActivity(github)).rejects.toThrow(/Limite de l'API GitHub atteinte/);
  });

  it("jeton refusé", async () => {
    vi.stubEnv("GITHUB_TOKEN", "ghp_faux");
    const fetchMock = vi.fn(async () => respond(401));
    vi.stubGlobal("fetch", fetchMock);
    await expect(fetchRepoActivity(github)).rejects.toThrow("Jeton GitHub refusé");
    // Le jeton part dans l'en-tête Authorization, vers api.github.com uniquement.
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe("https://api.github.com/repos/vercel/next.js");
    expect((init.headers as Record<string, string>).authorization).toBe("Bearer ghp_faux");
  });

  it("403 sur le dépôt : message de GitHub et piste de correction", async () => {
    vi.stubEnv("GITHUB_TOKEN", "github_pat_faux");
    vi.stubGlobal("fetch", vi.fn(async () => respond(403, { message: "Resource not accessible by personal access token" })));
    await expect(fetchRepoActivity(github)).rejects.toThrow(
      /Accès refusé par GitHub \(« Resource not accessible by personal access token » ?\)\..*Repository access/,
    );
  });

  it("GitLab et noms invalides : refusés sans appel réseau", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    await expect(fetchRepoActivity({ provider: "gitlab", owner: "g", name: "p" })).rejects.toThrow("GitHub uniquement");
    await expect(fetchRepoActivity({ provider: "github", owner: "..", name: "x" })).rejects.toThrow("Nom de dépôt invalide");
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe("fetchRepoActivity : permission manquante sur une section", () => {
  it("issues refusées (403) : le reste s'affiche, la section est signalée", async () => {
    vi.stubEnv("GITHUB_TOKEN", "github_pat_faux");
    const repoBody = {
      full_name: "vercel/next.js", description: null, stargazers_count: 1, forks_count: 0,
      default_branch: "main", pushed_at: null, html_url: "https://github.com/vercel/next.js", private: true,
    };
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string) => {
        if (url.endsWith("/repos/vercel/next.js")) return respond(200, repoBody);
        if (url.includes("/issues")) return respond(403, { message: "Resource not accessible by personal access token" });
        if (url.includes("/actions/runs")) return respond(200, { workflow_runs: [] });
        return respond(200, []);
      }),
    );
    const snapshot = await fetchRepoActivity(github);
    expect(snapshot.denied).toEqual(["issues"]);
    expect(snapshot.repo.fullName).toBe("vercel/next.js");
    expect(snapshot.ci.state).toBe("none");
  });
});
