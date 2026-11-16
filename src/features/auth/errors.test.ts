import { afterEach, describe, expect, it, vi } from "vitest";
import { authErrorMessage, GENERIC_AUTH_ERROR, logUnknownAuthError } from "./errors";

afterEach(() => vi.restoreAllMocks());

describe("authErrorMessage", () => {
  it("message clair pour les codes connus", () => {
    expect(authErrorMessage({ code: "invalid_credentials" })).toBe("E-mail ou mot de passe incorrect.");
    expect(authErrorMessage({ code: "email_address_invalid" })).toBe("Cette adresse e-mail est refusée. Utilise une autre adresse.");
    expect(authErrorMessage("email_not_confirmed")).toBe("Confirme ton adresse e-mail avant de te connecter.");
  });

  it("échec d'envoi de l'e-mail reconnu par son message", () => {
    expect(authErrorMessage({ code: "unexpected_failure", message: "Error sending confirmation email", status: 500 })).toBe(
      "Compte non créé : l'e-mail de confirmation n'a pas pu être envoyé. Réessaie plus tard.",
    );
  });

  it("générique sinon", () => {
    expect(authErrorMessage({ code: "quelque_chose" })).toBe(GENERIC_AUTH_ERROR);
    expect(authErrorMessage(undefined)).toBe(GENERIC_AUTH_ERROR);
  });
});

describe("logUnknownAuthError", () => {
  it("journalise code, statut et message des erreurs inconnues seulement", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    logUnknownAuthError("inscription", { code: "invalid_credentials" });
    expect(spy).not.toHaveBeenCalled();
    logUnknownAuthError("inscription", { code: "unexpected_failure", status: 500, message: "Error sending confirmation email" });
    expect(spy).toHaveBeenCalledWith("[auth] inscription : erreur Supabase non reconnue", {
      code: "unexpected_failure",
      status: 500,
      message: "Error sending confirmation email",
    });
  });
});
