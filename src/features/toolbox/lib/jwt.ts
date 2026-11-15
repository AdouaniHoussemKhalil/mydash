import { decodeBase64 } from "./base64";

export type JwtDates = { exp: Date | null; iat: Date | null; nbf: Date | null };

export type JwtResult =
  | {
      ok: true;
      header: Record<string, unknown>;
      payload: Record<string, unknown>;
      hasSignature: boolean;
      dates: JwtDates;
      /** null si le jeton n'a pas d'expiration. */
      expired: boolean | null;
      /** Pas encore valable (nbf dans le futur). */
      notYetValid: boolean;
    }
  | { ok: false; error: string };

function decodePart(part: string, name: string): Record<string, unknown> {
  const decoded = decodeBase64(part);
  if (!decoded.ok) throw new Error(`${name} : Base64 URL invalide`);
  let value: unknown;
  try {
    value = JSON.parse(decoded.output);
  } catch {
    throw new Error(`${name} : ce n'est pas du JSON`);
  }
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error(`${name} : objet JSON attendu`);
  return value as Record<string, unknown>;
}

/** Date d'un claim numérique en secondes (exp, iat, nbf), ou null. */
function claimDate(value: unknown): Date | null {
  return typeof value === "number" && Number.isFinite(value) ? new Date(value * 1000) : null;
}

/**
 * Décode un JWT (en-tête et contenu) sans vérifier la signature.
 * Accepte un « Bearer … » collé tel quel.
 */
export function decodeJwt(input: string, now: Date = new Date()): JwtResult {
  const token = input.trim().replace(/^Bearer\s+/i, "");
  if (!token) return { ok: false, error: "Colle un JWT pour commencer" };
  const parts = token.split(".");
  if (parts.length !== 3) return { ok: false, error: `Un JWT a 3 parties séparées par des points (ici ${parts.length})` };
  try {
    const header = decodePart(parts[0]!, "En-tête");
    const payload = decodePart(parts[1]!, "Contenu");
    const dates = { exp: claimDate(payload.exp), iat: claimDate(payload.iat), nbf: claimDate(payload.nbf) };
    return {
      ok: true,
      header,
      payload,
      hasSignature: parts[2]!.length > 0,
      dates,
      expired: dates.exp ? dates.exp.getTime() <= now.getTime() : null,
      notYetValid: dates.nbf ? dates.nbf.getTime() > now.getTime() : false,
    };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "JWT invalide" };
  }
}
