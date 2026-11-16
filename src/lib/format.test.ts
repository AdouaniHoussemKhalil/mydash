import { describe, expect, it } from "vitest";
import { excerpt, formatRelative } from "./format";

describe("formatRelative", () => {
  const now = new Date("2026-11-12T12:00:00Z");

  it.each([
    ["2026-11-12T11:59:50Z", "à l'instant"],
    ["2026-11-12T11:55:00Z", "il y a 5 minutes"],
    ["2026-11-11T12:00:00Z", "hier"],
    ["2026-11-14T12:00:00Z", "après-demain"],
  ])("%s → %s", (date, expected) => {
    expect(formatRelative(date, now)).toBe(expected);
  });
});

describe("excerpt", () => {
  it("retire la syntaxe Markdown et les blocs de code", () => {
    expect(excerpt("# Titre\n\nDu **gras** et `code`\n```js\nx()\n```\n- puce")).toBe(
      "Titre Du gras et code puce",
    );
  });

  it("ne laisse pas d'espace avant la ponctuation ni ne casse les tirets", () => {
    expect(excerpt("Du contenu **Markdown**. Mot-clé")).toBe("Du contenu Markdown. Mot-clé");
  });

  it("tronque proprement", () => {
    expect(excerpt("a".repeat(300), 10)).toBe(`${"a".repeat(9)}…`);
  });
});
