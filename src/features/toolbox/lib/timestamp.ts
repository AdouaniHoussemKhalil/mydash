export type TimestampResult =
  | { ok: true; date: Date; seconds: number; milliseconds: number; unit: "seconds" | "milliseconds" | "date" }
  | { ok: false; error: string };

/** Au-delà, un nombre est lu en millisecondes (≈ an 33658 en secondes). */
const MS_THRESHOLD = 1e12;

/**
 * Timestamp Unix (secondes ou millisecondes, détecté) ou date (ISO,
 * « 2026-11-15 10:30 ») → instant.
 */
export function parseTimestamp(input: string): TimestampResult {
  const value = input.trim();
  if (!value) return { ok: false, error: "Saisis un timestamp ou une date" };

  if (/^-?\d+(\.\d+)?$/.test(value)) {
    const number = Number(value);
    const unit = Math.abs(number) >= MS_THRESHOLD ? "milliseconds" : "seconds";
    const milliseconds = unit === "milliseconds" ? number : number * 1000;
    const date = new Date(milliseconds);
    if (Number.isNaN(date.getTime())) return { ok: false, error: "Timestamp hors limites" };
    return { ok: true, date, seconds: Math.floor(milliseconds / 1000), milliseconds: Math.trunc(milliseconds), unit };
  }

  // « 2026-11-15 10:30 » : l'espace devient « T » (lu en heure locale).
  const date = new Date(/^\d{4}-\d{2}-\d{2} \d/.test(value) ? value.replace(" ", "T") : value);
  if (Number.isNaN(date.getTime())) return { ok: false, error: "Ni un timestamp, ni une date reconnue (ex. 2026-11-15T10:30:00Z)" };
  return { ok: true, date, seconds: Math.floor(date.getTime() / 1000), milliseconds: date.getTime(), unit: "date" };
}

const localFormat = new Intl.DateTimeFormat("fr", { dateStyle: "full", timeStyle: "medium" });
const utcFormat = new Intl.DateTimeFormat("fr", { dateStyle: "full", timeStyle: "medium", timeZone: "UTC" });

export function formatLocal(date: Date): string {
  return localFormat.format(date);
}

export function formatUtc(date: Date): string {
  return `${utcFormat.format(date)} UTC`;
}
