import { describe, expect, it } from "vitest";
import { parseRepo, repoFromHref, repoUrl } from "./repo";

describe("repoUrl", () => {
  it("donne l'URL canonique du dépôt", () => {
    const repo = parseRepo(new URL("https://github.com/vercel/next.js/tree/canary/docs"))!;
    expect(repoUrl(repo)).toBe("https://github.com/vercel/next.js");
    expect(repoUrl(repoFromHref("https://gitlab.com/group/sub/project.git")!)).toBe("https://gitlab.com/group/sub/project");
  });

  it("refuse ce qui n'est pas un dépôt", () => {
    expect(repoFromHref("https://github.com/settings/profile")).toBeNull();
    expect(repoFromHref("https://github.com/vercel")).toBeNull();
    expect(repoFromHref("https://nextjs.org/docs")).toBeNull();
    expect(repoFromHref("pas une url")).toBeNull();
  });
});
