import { describe, expect, it } from "vitest";
import { normalize, toPrefixQuery } from "./search";

describe("toPrefixQuery", () => {
  it("transforme chaque mot en préfixe", () => {
    expect(toPrefixQuery("Nex app")).toBe("nex:* & app:*");
  });

  it("garde les accents et les chiffres", () => {
    expect(toPrefixQuery("idée v2")).toBe("idée:* & v2:*");
  });

  it("neutralise la syntaxe tsquery", () => {
    expect(toPrefixQuery("a & (b | !c):*")).toBe("a:* & b:* & c:*");
  });

  it("rien d'exploitable → null", () => {
    expect(toPrefixQuery("  &&  ")).toBeNull();
  });

  it("limite le nombre de termes", () => {
    expect(toPrefixQuery("a b c d", 2)).toBe("a:* & b:*");
  });
});

describe("normalize", () => {
  it("ignore accents et casse", () => {
    expect(normalize(" Aujourd'hui Évènement ")).toBe("aujourd'hui evenement");
  });
});
