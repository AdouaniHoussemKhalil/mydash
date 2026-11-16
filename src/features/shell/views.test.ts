import { describe, expect, it } from "vitest";
import { parseView, withSearchParams } from "./views";

describe("parseView", () => {
  it.each([
    ["cards", "cards"],
    ["table", "table"],
    [undefined, "list"],
    ["kanban", "list"],
    [["table", "cards"], "table"],
  ] as const)("%s → %s", (input, expected) => {
    expect(parseView(input)).toBe(expected);
  });
});

describe("withSearchParams", () => {
  it("ajoute et conserve les paramètres existants", () => {
    expect(withSearchParams("view=cards", { item: "42" })).toBe("?view=cards&item=42");
  });

  it("supprime une clé avec null", () => {
    expect(withSearchParams("view=cards&item=42", { item: null })).toBe("?view=cards");
  });

  it("retourne une chaîne vide sans paramètre", () => {
    expect(withSearchParams("item=42", { item: null })).toBe("");
  });
});
