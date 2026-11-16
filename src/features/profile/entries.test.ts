import { describe, expect, it } from "vitest";
import { ENTRY_SCHEMAS, formatPeriod, monthSchema, toMonthInput } from "./entries";

describe("monthSchema", () => {
  it("ramène au 1er du mois, vide → null", () => {
    expect(monthSchema.parse("2024-06")).toBe("2024-06-01");
    expect(monthSchema.parse("2024-06-17")).toBe("2024-06-01");
    expect(monthSchema.parse("")).toBeNull();
  });

  it("refuse un mois impossible", () => {
    expect(monthSchema.safeParse("2024-13").success).toBe(false);
    expect(monthSchema.safeParse("juin 2024").success).toBe(false);
  });
});

describe("ENTRY_SCHEMAS", () => {
  it("compétence : niveau parmi les 4", () => {
    expect(ENTRY_SCHEMAS.skills.parse({ name: " TypeScript ", level: "expert" })).toEqual({
      name: "TypeScript",
      category: "",
      level: "expert",
      show_on_cv: true,
    });
    expect(ENTRY_SCHEMAS.skills.safeParse({ name: "SQL", level: "champion" }).success).toBe(false);
  });

  it("expérience : début obligatoire, fin après le début, en cours = null", () => {
    expect(ENTRY_SCHEMAS.experiences.safeParse({ title: "Dev", start_date: "" }).success).toBe(false);
    const late = ENTRY_SCHEMAS.experiences.safeParse({ title: "Dev", start_date: "2024-06", end_date: "2023-01" });
    expect(late.success).toBe(false);
    expect(late.error?.issues[0]?.message).toBe("La fin ne peut pas précéder le début");
    expect(ENTRY_SCHEMAS.experiences.parse({ title: "Dev", start_date: "2024-06" }).end_date).toBeNull();
  });

  it("projet : lien normalisé ou refusé", () => {
    expect(ENTRY_SCHEMAS.projects.parse({ name: "MyDash", url: "github.com/moi/mydash" }).url).toBe(
      "https://github.com/moi/mydash",
    );
    expect(ENTRY_SCHEMAS.projects.safeParse({ name: "X", url: "javascript:alert(1)" }).success).toBe(false);
  });

  it("refuse les champs inconnus (user_id…)", () => {
    expect(ENTRY_SCHEMAS.languages.safeParse({ name: "Anglais", user_id: "x" }).success).toBe(false);
  });
});

describe("formatPeriod", () => {
  it("période lisible", () => {
    expect(formatPeriod("2022-01-01", null)).toBe("janv. 2022 – aujourd'hui");
    expect(formatPeriod("2019-09-01", "2021-06-01")).toBe("sept. 2019 – juin 2021");
    expect(formatPeriod(null, "2021-06-01")).toBe("juin 2021");
    expect(formatPeriod(null, null)).toBe("");
    expect(toMonthInput("2024-06-01")).toBe("2024-06");
  });
});
