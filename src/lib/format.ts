const relative = new Intl.RelativeTimeFormat("fr", { numeric: "auto" });
const absolute = new Intl.DateTimeFormat("fr", { dateStyle: "medium", timeStyle: "short" });

const STEPS: [Intl.RelativeTimeFormatUnit, number][] = [
  ["year", 365 * 24 * 3600],
  ["month", 30 * 24 * 3600],
  ["week", 7 * 24 * 3600],
  ["day", 24 * 3600],
  ["hour", 3600],
  ["minute", 60],
];

/** « il y a 5 minutes », « hier », « à l'instant »… */
export function formatRelative(date: string | Date, now: Date = new Date()): string {
  const seconds = Math.round((new Date(date).getTime() - now.getTime()) / 1000);
  for (const [unit, size] of STEPS) {
    if (Math.abs(seconds) >= size) return relative.format(Math.round(seconds / size), unit);
  }
  return "à l'instant";
}

/** « 12 nov. 2026, 14:05 » */
export function formatDateTime(date: string | Date): string {
  return absolute.format(new Date(date));
}

/** Premier extrait lisible d'un corps Markdown, pour les aperçus. */
export function excerpt(markdown: string, max = 160): string {
  const text = markdown
    .replace(/```[\s\S]*?```/g, " ")
    // Emphase et code en ligne : retirés sans espace (« **gras**. » → « gras. »)
    .replace(/[*_`~]/g, "")
    .replace(/^\s*[-+]\s+/gm, " ")
    .replace(/[#>\[\]()!]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return text.length > max ? `${text.slice(0, max - 1).trimEnd()}…` : text;
}
