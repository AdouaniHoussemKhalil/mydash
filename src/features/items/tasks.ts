import { z } from "zod";
import { Constants } from "@/lib/supabase/database.types";

export const TASK_STATUSES = Constants.public.Enums.task_status;
export type TaskStatus = (typeof TASK_STATUSES)[number];

export const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  todo: "À faire",
  doing: "En cours",
  done: "Terminé",
};

export const taskStatusSchema = z.enum(TASK_STATUSES);

/** Date d'échéance « AAAA-MM-JJ » réelle (pas de 31 février), ou null. */
export const dueDateSchema = z
  .string()
  .trim()
  .transform((value, ctx) => {
    if (value === "") return null;
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
    const date = match ? new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3]))) : null;
    if (!date || date.toISOString().slice(0, 10) !== value) {
      ctx.addIssue({ code: "custom", message: "Date invalide" });
      return z.NEVER;
    }
    return value;
  })
  .nullable();

export const taskPatchSchema = z
  .object({ status: taskStatusSchema, due_date: dueDateSchema })
  .partial()
  .strict()
  .refine((patch) => Object.keys(patch).length > 0, "Rien à mettre à jour");
export type TaskPatch = z.input<typeof taskPatchSchema>;

/** Date du jour « AAAA-MM-JJ » dans le fuseau local (du navigateur). */
export function localToday(now: Date = new Date()): string {
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
}

/** En retard : échéance passée et tâche non terminée. */
export function isOverdue(dueDate: string | null, status: TaskStatus, today: string): boolean {
  return dueDate !== null && status !== "done" && dueDate < today;
}

const dueFormat = new Intl.DateTimeFormat("fr", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });

/** « 1 déc. 2026 » (date sans heure, lue en UTC pour ne pas décaler d'un jour). */
export function formatDueDate(dueDate: string): string {
  return dueFormat.format(new Date(`${dueDate}T00:00:00Z`));
}
