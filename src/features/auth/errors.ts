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
};

export const GENERIC_AUTH_ERROR = "Connexion impossible pour le moment. Réessaie.";

export function authErrorMessage(code: string | undefined): string {
  return (code && MESSAGES[code]) || GENERIC_AUTH_ERROR;
}
