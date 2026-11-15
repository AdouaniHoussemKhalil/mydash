// @vitest-environment node
import { describe, expect, it } from "vitest";
import { diffLines, toSideBySide } from "./diff";
import { hashText } from "./hash";

describe("diffLines", () => {
  it("lignes communes, supprimées et ajoutées, avec numéros", () => {
    const result = diffLines("a\nb\nc\nd", "a\nB\nc\nd\ne");
    expect(result.lines).toEqual([
      { type: "equal", text: "a", left: 1, right: 1 },
      { type: "removed", text: "b", left: 2 },
      { type: "added", text: "B", right: 2 },
      { type: "equal", text: "c", left: 3, right: 3 },
      { type: "equal", text: "d", left: 4, right: 4 },
      { type: "added", text: "e", right: 5 },
    ]);
    expect([result.added, result.removed, result.identical]).toEqual([2, 1, false]);
  });

  it("textes identiques, fins de ligne Windows, espaces de fin ignorés à la demande", () => {
    expect(diffLines("x\r\ny", "x\ny").identical).toBe(true);
    expect(diffLines("x  \ny", "x\ny").identical).toBe(false);
    expect(diffLines("x  \ny", "x\ny", true).identical).toBe(true);
  });

  it("textes vides", () => {
    expect(diffLines("", "a").lines).toEqual([{ type: "added", text: "a", right: 1 }]);
    expect(diffLines("", "").identical).toBe(true);
  });

  it("vue côte à côte : suppression et ajout mis en regard", () => {
    const rows = toSideBySide(diffLines("a\nb\nc", "a\nB\nC\nc").lines);
    expect(rows).toEqual([
      { left: { number: 1, text: "a", changed: false }, right: { number: 1, text: "a", changed: false } },
      { left: { number: 2, text: "b", changed: true }, right: { number: 2, text: "B", changed: true } },
      { left: null, right: { number: 3, text: "C", changed: true } },
      { left: { number: 3, text: "c", changed: false }, right: { number: 4, text: "c", changed: false } },
    ]);
  });
});

describe("hashText", () => {
  it("valeurs de référence (UTF-8)", async () => {
    expect(await hashText("abc", "SHA-1")).toBe("a9993e364706816aba3e25717850c26c9cd0d89d");
    expect(await hashText("abc", "SHA-256")).toBe("ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad");
    expect((await hashText("", "SHA-512")).slice(0, 16)).toBe("cf83e1357eefb8bd");
    // Référence calculée avec node:crypto (accent encodé en UTF-8).
    expect(await hashText("é", "SHA-256")).toBe("4a99557e4033c3539de2eb65472017cad5f9557f7a0625a09f1c3f6e2ba69c4c");
  });
});
