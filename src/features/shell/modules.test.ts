import { describe, expect, it } from "vitest";
import { Constants } from "@/lib/supabase/database.types";
import { getModule, getModuleByType, MODULES, PRIMARY_NAV } from "./modules";

describe("modules", () => {
  it("couvre chaque type d'item exactement une fois", () => {
    const types = MODULES.map((module) => module.type).sort();
    expect(types).toEqual([...Constants.public.Enums.item_type].sort());
  });

  it("a des slugs uniques qui n'entrent pas en conflit avec la navigation", () => {
    const slugs = MODULES.map((module) => module.slug);
    const reserved = PRIMARY_NAV.map((entry) => entry.href.slice(1));
    expect(new Set(slugs).size).toBe(slugs.length);
    expect(slugs.filter((slug) => reserved.includes(slug as never))).toEqual([]);
  });

  it("retrouve un module par slug et par type", () => {
    expect(getModule("notes")?.type).toBe("note");
    expect(getModule("inconnu")).toBeUndefined();
    expect(getModuleByType("event").slug).toBe("calendar");
  });
});
