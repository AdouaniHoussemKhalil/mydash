import { z } from "zod";

export const CALENDAR_NOTE_MAX = 200;

export type CalendarNote = { id: string; day: string; text: string };

/** Jour « AAAA-MM-JJ » réel. */
export const daySchema = z.string().refine((value) => {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return false;
  const date = new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])));
  return date.toISOString().slice(0, 10) === value;
}, "Jour invalide");

export const noteTextSchema = z
  .string()
  .trim()
  .min(1, "Écris quelque chose")
  .max(CALENDAR_NOTE_MAX, `${CALENDAR_NOTE_MAX} caractères maximum`);

export const noteIdSchema = z.uuid("Note introuvable");

/** Jour local « AAAA-MM-JJ » d'une date du calendrier (minuit local). */
export function toDayKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}
