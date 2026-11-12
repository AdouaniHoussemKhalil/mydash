import { describe, expect, it } from "vitest";
import { detectCapture, parseRepo, parseUrl } from "./detect-type";

describe("detectCapture", () => {
  it("vide ou espaces → rien", () => {
    expect(detectCapture("")).toBeNull();
    expect(detectCapture("   \n ")).toBeNull();
  });

  describe("notes", () => {
    it("texte simple → note", () => {
      expect(detectCapture("Acheter du café")).toEqual({ type: "note", title: "Acheter du café", body: "" });
    });

    it("première ligne = titre, le reste = contenu", () => {
      expect(detectCapture("Idée\n\nDétails sur\nplusieurs lignes")).toEqual({
        type: "note",
        title: "Idée",
        body: "Détails sur\nplusieurs lignes",
      });
    });

    it("une phrase contenant une URL reste une note", () => {
      expect(detectCapture("lire https://example.com ce soir")?.type).toBe("note");
    });

    it.each(["v1.2", "fichier.txt", "README.md", "3.14", "e.g"])("« %s » n'est pas une URL", (text) => {
      expect(detectCapture(text)?.type).toBe("note");
    });

    it("tronque un titre trop long", () => {
      const capture = detectCapture("x".repeat(600));
      expect(capture?.title).toHaveLength(500);
      expect(capture?.title.endsWith("…")).toBe(true);
    });
  });

  describe("liens", () => {
    it("URL complète → lien, titre lisible", () => {
      expect(detectCapture("https://nextjs.org/docs/app/")).toEqual({
        type: "link",
        title: "nextjs.org/docs/app",
        body: "https://nextjs.org/docs/app/",
        url: "https://nextjs.org/docs/app/",
      });
    });

    it.each([
      ["www.example.com", "https://www.example.com/"],
      ["example.com/a?b=1", "https://example.com/a?b=1"],
      ["  https://Example.COM  ", "https://example.com/"],
    ])("« %s » → %s", (input, url) => {
      const capture = detectCapture(input);
      expect(capture?.type).toBe("link");
      expect(capture && "url" in capture ? capture.url : null).toBe(url);
    });

    it("refuse les schémas dangereux", () => {
      expect(detectCapture("javascript:alert(1)")?.type).toBe("note");
      expect(detectCapture("data:text/html,x")?.type).toBe("note");
    });

    it("github.com sans dépôt → lien", () => {
      expect(detectCapture("https://github.com/settings/profile")?.type).toBe("link");
      expect(detectCapture("https://github.com/vercel")?.type).toBe("link");
    });
  });

  describe("repos", () => {
    it.each([
      ["https://github.com/vercel/next.js", "vercel", "next.js"],
      ["github.com/supabase/supabase/pull/42", "supabase", "supabase"],
      ["https://github.com/owner/repo.git", "owner", "repo"],
    ])("%s → %s/%s", (input, owner, name) => {
      const capture = detectCapture(input);
      expect(capture?.type).toBe("repo");
      expect(capture?.title).toBe(`${owner}/${name}`);
    });

    it("GitLab avec sous-groupes", () => {
      expect(parseRepo(parseUrl("https://gitlab.com/group/sub/project/-/issues/3")!)).toEqual({
        provider: "gitlab",
        owner: "group/sub",
        name: "project",
      });
    });
  });
});
