import { describe, expect, it } from "vitest";
import { createTagSchema, updateTagSchema } from "./schemas";

describe("createTagSchema", () => {
  it("nettoie le nom", () => {
    expect(createTagSchema.parse({ name: "  #Dev   Ops " })).toEqual({ name: "Dev Ops", color: null });
  });

  it("refuse un nom vide, y compris « # » seul", () => {
    expect(createTagSchema.safeParse({ name: "  " }).success).toBe(false);
    expect(createTagSchema.safeParse({ name: "##" }).success).toBe(false);
  });
});

describe("updateTagSchema", () => {
  it("accepte un changement de couleur seul", () => {
    expect(updateTagSchema.parse({ color: "#30A46C" })).toEqual({ color: "#30A46C" });
  });

  it("refuse workspace_id", () => {
    expect(updateTagSchema.safeParse({ workspace_id: "x" }).success).toBe(false);
  });
});
