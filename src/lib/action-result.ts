/** Résultat d'une server action : jamais d'exception vers le client. */
export type ActionResult<T = undefined> = { ok: true; data: T } | { ok: false; error: string };

export function firstIssue(error: { issues: { message: string }[] }, fallback = "Données invalides") {
  return error.issues[0]?.message ?? fallback;
}
