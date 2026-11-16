/** Messages d'erreur affichables, sans détail technique ni énumération de comptes. */
const MESSAGES: Record<string, string> = {
  invalid_credentials: "E-mail ou mot de passe incorrect.",
  email_not_confirmed: "Confirme ton adresse e-mail avant de te connecter.",
  user_already_exists: "Un compte existe déjà avec cette adresse. Connecte-toi.",
  email_exists: "Un compte existe déjà avec cette adresse. Connecte-toi.",
  weak_password: "Mot de passe trop faible.",
  over_request_rate_limit: "Trop de tentatives. Réessaie dans quelques minutes.",
  over_email_send_rate_limit: "Trop d'e-mails envoyés. Réessaie dans quelques minutes.",
  signup_disabled: "Les inscriptions sont fermées.",
  email_address_invalid: "Cette adresse e-mail est refusée. Utilise une autre adresse.",
  email_address_not_authorized: "L'e-mail de confirmation ne peut pas être envoyé à cette adresse pour l'instant.",
  email_provider_disabled: "La connexion par e-mail est désactivée.",
  provider_disabled: "Ce mode de connexion est désactivé.",
  user_banned: "Ce compte est suspendu.",
};

export const GENERIC_AUTH_ERROR = "Connexion impossible pour le moment. Réessaie.";

/** Échec d'envoi de l'e-mail de confirmation (SMTP) : pas de code dédié, seulement ce message. */
const EMAIL_SENDING = /error sending .*email/i;

export type AuthErrorLike = { code?: string | undefined; message?: string | undefined; status?: number | undefined };

export function authErrorMessage(error: AuthErrorLike | string | undefined): string {
  const details = typeof error === "string" ? { code: error } : (error ?? {});
  if (details.code && MESSAGES[details.code]) return MESSAGES[details.code]!;
  if (details.message && EMAIL_SENDING.test(details.message)) {
    return "Compte non créé : l'e-mail de confirmation n'a pas pu être envoyé. Réessaie plus tard.";
  }
  return GENERIC_AUTH_ERROR;
}

/**
 * Trace serveur (logs de l'hébergeur) d'une erreur non reconnue : code,
 * statut et message de Supabase, jamais l'e-mail ni le mot de passe.
 */
export function logUnknownAuthError(context: string, error: AuthErrorLike): void {
  if (error.code && MESSAGES[error.code]) return;
  console.error(`[auth] ${context} : erreur Supabase non reconnue`, {
    code: error.code ?? null,
    status: error.status ?? null,
    message: error.message ?? null,
  });
}
