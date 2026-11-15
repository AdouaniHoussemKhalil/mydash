import type { TextResult } from "./base64";

export function encodeUrl(text: string): string {
  return encodeURIComponent(text);
}

/** Décode (les « + » d'un formulaire deviennent des espaces si demandé). */
export function decodeUrl(text: string, plusAsSpace = true): TextResult {
  try {
    return { ok: true, output: decodeURIComponent(plusAsSpace ? text.replace(/\+/g, " ") : text) };
  } catch {
    return { ok: false, error: "Encodage invalide : une séquence « % » est incomplète ou erronée" };
  }
}
