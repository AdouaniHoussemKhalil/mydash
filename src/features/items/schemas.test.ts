import { describe, expect, it } from "vitest";
import { createItemSchema, itemIdSchema, updateItemSchema } from "./schemas";

describe("createItemSchema", () => {
  it("n'exige que le type et le titre", () => {
    expect(createItemSchema.parse({ type: "note", title: "  Idée  " })).toEqual({
      type: "note",
      title: "Idée",
      body: "",
    });
  });

  it("refuse un titre vide ou fait d'espaces", () => {
    expect(createItemSchema.safeParse({ type: "note", title: "   " }).success).toBe(false);
  });

  it("refuse un type inconnu", () => {
    expect(createItemSchema.safeParse({ type: "video", title: "x" }).success).toBe(false);
  });

  it("refuse un titre trop long", () => {
    expect(createItemSchema.safeParse({ type: "note", title: "x".repeat(501) }).success).toBe(false);
  });
});

describe("updateItemSchema", () => {
  it("accepte un patch partiel", () => {
    expect(updateItemSchema.parse({ pinned: true })).toEqual({ pinned: true });
  });

  it("refuse un patch vide", () => {
    expect(updateItemSchema.safeParse({}).success).toBe(false);
  });

  it("refuse les champs non modifiables", () => {
    expect(updateItemSchema.safeParse({ workspace_id: "x" }).success).toBe(false);
    expect(updateItemSchema.safeParse({ title: "ok", created_by: "x" }).success).toBe(false);
  });

  it("refuse de vider le titre", () => {
    expect(updateItemSchema.safeParse({ title: " " }).success).toBe(false);
  });
});

describe("itemIdSchema", () => {
  it("accepte un uuid et refuse le reste", () => {
    expect(itemIdSchema.safeParse("0b9f8a5e-2c1d-4b7a-9e3f-1a2b3c4d5e6f").success).toBe(true);
    expect(itemIdSchema.safeParse("abc").success).toBe(false);
  });
});
