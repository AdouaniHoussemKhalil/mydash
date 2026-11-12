import { describe, expect, it } from "vitest";
import { credentialsSchema } from "./schemas";

describe("credentialsSchema", () => {
  it("normalise l'e-mail", () => {
    const result = credentialsSchema.parse({ email: "  Moi@Example.COM ", password: "motdepasse-solide" });
    expect(result.email).toBe("moi@example.com");
  });

  it("refuse un mot de passe trop court", () => {
    const result = credentialsSchema.safeParse({ email: "moi@example.com", password: "court" });
    expect(result.success).toBe(false);
  });

  it("refuse un e-mail invalide", () => {
    const result = credentialsSchema.safeParse({ email: "pas-un-email", password: "motdepasse-solide" });
    expect(result.success).toBe(false);
  });
});
