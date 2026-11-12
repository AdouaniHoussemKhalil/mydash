import { describe, expect, it } from "vitest";
import { createSpaceSchema, updateSpaceSchema } from "./schemas";

describe("createSpaceSchema", () => {
  it("n'exige que le nom", () => {
    expect(createSpaceSchema.parse({ name: " MyDash " })).toEqual({ name: "MyDash", icon: null, color: null });
  });

  it("transforme une icône vide en null", () => {
    expect(createSpaceSchema.parse({ name: "Perso", icon: "  " }).icon).toBeNull();
  });

  it("refuse une icône trop longue", () => {
    expect(createSpaceSchema.safeParse({ name: "x", icon: "https://evil.test/x.png" }).success).toBe(false);
  });
});

describe("updateSpaceSchema", () => {
  it("refuse un patch vide ou un champ inconnu", () => {
    expect(updateSpaceSchema.safeParse({}).success).toBe(false);
    expect(updateSpaceSchema.safeParse({ position: 3 }).success).toBe(false);
  });
});
