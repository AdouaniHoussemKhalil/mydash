/**
 * Requête tsquery « préfixe » (config simple) depuis une saisie libre :
 * « nex app » → « nex:* & app:* ». Ne garde que lettres et chiffres, ce
 * qui neutralise les opérateurs tsquery (&, |, !, :, parenthèses…).
 */
export function toPrefixQuery(input: string, maxTerms = 8): string | null {
  const terms = input
    .toLowerCase()
    .normalize("NFC")
    .split(/[^\p{L}\p{N}]+/u)
    .filter(Boolean)
    .slice(0, maxTerms);
  return terms.length ? terms.map((term) => `${term}:*`).join(" & ") : null;
}

/** Comparaison sans accents ni casse (filtre de navigation de la palette). */
export function normalize(text: string): string {
  return text
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .trim();
}
