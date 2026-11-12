import { describe, expect, it } from "vitest";
import { isPublicPath, safeNextPath } from "./paths";

describe("isPublicPath", () => {
  it.each(["/login", "/auth/callback", "/auth/confirm"])("%s est public", (path) => {
    expect(isPublicPath(path)).toBe(true);
  });

  it.each(["/", "/inbox", "/login-bis", "/authx"])("%s est protégé", (path) => {
    expect(isPublicPath(path)).toBe(false);
  });
});

describe("safeNextPath", () => {
  it("garde un chemin interne", () => {
    expect(safeNextPath("/inbox?view=cards")).toBe("/inbox?view=cards");
  });

  it.each([null, undefined, "", "/", "https://evil.test", "//evil.test", "/\\evil.test", "inbox"])(
    "%s → /today",
    (next) => {
      expect(safeNextPath(next)).toBe("/today");
    },
  );
});
