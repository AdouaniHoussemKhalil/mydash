import { describe, expect, it } from "vitest";
import { daySchema, noteTextSchema, toDayKey } from "./schemas";

describe("calendrier : validation", () => {
  it("jour réel uniquement", () => {
    expect(daySchema.safeParse("2026-11-12").success).toBe(true);
    expect(daySchema.safeParse("2026-02-30").success).toBe(false);
    expect(daySchema.safeParse("12/11/2026").success).toBe(false);
  });

  it("texte : nettoyé, non vide, 200 caractères maximum", () => {
    expect(noteTextSchema.parse("  Appeler le comptable ")).toBe("Appeler le comptable");
    expect(noteTextSchema.safeParse("   ").success).toBe(false);
    expect(noteTextSchema.safeParse("x".repeat(201)).success).toBe(false);
  });

  it("jour local d'une date", () => {
    expect(toDayKey(new Date(2026, 10, 5, 23, 30))).toBe("2026-11-05");
  });
});
