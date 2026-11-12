export const VIEW_MODES = ["list", "cards", "table"] as const;
export type ViewMode = (typeof VIEW_MODES)[number];

export const VIEW_LABELS: Record<ViewMode, string> = {
  list: "Liste",
  cards: "Cartes",
  table: "Tableau",
};

export const DEFAULT_VIEW: ViewMode = "list";

export function parseView(value: string | readonly string[] | undefined | null): ViewMode {
  const raw = Array.isArray(value) ? value[0] : value;
  return VIEW_MODES.find((mode) => mode === raw) ?? DEFAULT_VIEW;
}

/**
 * Construit la query string en conservant les autres paramètres.
 * `null` supprime la clé. Retourne « ?… » ou une chaîne vide.
 */
export function withSearchParams(
  current: URLSearchParams | string,
  changes: Record<string, string | null>,
): string {
  const params = new URLSearchParams(current);
  for (const [key, value] of Object.entries(changes)) {
    if (value === null) params.delete(key);
    else params.set(key, value);
  }
  const query = params.toString();
  return query ? `?${query}` : "";
}
