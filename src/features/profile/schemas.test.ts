import { describe, expect, it } from "vitest";
import { initials, photoInfoSchema, profilePatchSchema } from "./schemas";

describe("profilePatchSchema", () => {
  it("normalise les liens et vide → null", () => {
    expect(profilePatchSchema.parse({ linkedin: " linkedin.com/in/moi " })).toEqual({ linkedin: "https://linkedin.com/in/moi" });
    expect(profilePatchSchema.parse({ website: "", phone: "  " })).toEqual({ website: null, phone: null });
  });

  it("refuse un lien ou un e-mail invalide", () => {
    expect(profilePatchSchema.safeParse({ github: "javascript:alert(1)" }).success).toBe(false);
    expect(profilePatchSchema.safeParse({ contact_email: "pas-un-mail" }).success).toBe(false);
    expect(profilePatchSchema.parse({ contact_email: "" })).toEqual({ contact_email: null });
  });

  it("refuse les champs inconnus et un patch vide", () => {
    expect(profilePatchSchema.safeParse({ user_id: "x" }).success).toBe(false);
    expect(profilePatchSchema.safeParse({}).success).toBe(false);
  });
});

describe("photoInfoSchema", () => {
  it("images de 5 Mo maximum", () => {
    expect(photoInfoSchema.safeParse({ mimeType: "image/png", size: 1000 }).success).toBe(true);
    expect(photoInfoSchema.safeParse({ mimeType: "image/svg+xml", size: 1000 }).success).toBe(false);
    expect(photoInfoSchema.safeParse({ mimeType: "image/jpeg", size: 6 * 1024 * 1024 }).success).toBe(false);
  });
});

describe("initials", () => {
  it("première et dernière initiale", () => {
    expect(initials("Houssem Khalil Adouani")).toBe("HA");
    expect(initials("alice")).toBe("A");
    expect(initials("  ")).toBe("?");
  });
});
