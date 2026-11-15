import { describe, expect, it } from "vitest";
import { parseRichText } from "./rich-text";

describe("parseRichText", () => {
  it("sous-titres, puces groupées et paragraphes", () => {
    const text = [
      "Participation au développement du Portail Financeur.",
      "",
      "MES TÂCHES :",
      "▪ Conception de nouvelles fonctionnalités",
      "▪ Pipelines CI/CD avec Azure DevOps",
      "Environnement technique :",
      "- C#, .NET 7",
      "• React 17",
    ].join("\n");
    expect(parseRichText(text)).toEqual([
      { type: "paragraph", text: "Participation au développement du Portail Financeur." },
      { type: "heading", text: "MES TÂCHES" },
      { type: "list", items: ["Conception de nouvelles fonctionnalités", "Pipelines CI/CD avec Azure DevOps"] },
      { type: "heading", text: "Environnement technique" },
      { type: "list", items: ["C#, .NET 7", "React 17"] },
    ]);
  });

  it("un tiret collé n'est pas une puce, une phrase longue finissant par « : » reste un paragraphe", () => {
    expect(parseRichText("-5 % de temps de build")).toEqual([{ type: "paragraph", text: "-5 % de temps de build" }]);
    const long = `${"Très longue phrase d'introduction ".repeat(3)}:`;
    expect(parseRichText(long)[0]?.type).toBe("paragraph");
  });

  it("texte vide → aucun bloc", () => {
    expect(parseRichText("  \n ")).toEqual([]);
  });
});
