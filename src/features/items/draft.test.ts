import { describe, expect, it } from "vitest";
import { draftPatch } from "./draft";

const saved = { title: "Titre", body: "Corps" };

describe("draftPatch", () => {
  it("ne renvoie rien sans changement", () => {
    expect(draftPatch(saved, { ...saved })).toBeNull();
  });

  it("ignore des espaces ajoutés autour du titre", () => {
    expect(draftPatch(saved, { ...saved, title: "  Titre  " })).toBeNull();
  });

  it("n'envoie jamais un titre vide", () => {
    expect(draftPatch(saved, { title: "   ", body: "Corps" })).toBeNull();
    expect(draftPatch(saved, { title: "", body: "Nouveau" })).toEqual({ body: "Nouveau" });
  });

  it("renvoie uniquement les champs modifiés", () => {
    expect(draftPatch(saved, { title: "Autre", body: "Corps" })).toEqual({ title: "Autre" });
    expect(draftPatch(saved, { title: "Autre", body: "" })).toEqual({ title: "Autre", body: "" });
  });
});
