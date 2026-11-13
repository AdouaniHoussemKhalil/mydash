"use client";

import { CalendarClock } from "lucide-react";
import { Badge } from "@/components/ui/core";
import { useIsClient } from "@/hooks/useIsClient";
import { cn } from "@quickadui/utils";
import { formatDueDate, isOverdue, localToday, TASK_STATUS_LABELS, type TaskStatus } from "../tasks";

const STATUS_VARIANT = { todo: "outline", doing: "soft", done: "success" } as const;

export function StatusBadge({ status }: { status: TaskStatus }) {
  return (
    <Badge variant={STATUS_VARIANT[status]} className="shrink-0">
      {TASK_STATUS_LABELS[status]}
    </Badge>
  );
}

/**
 * Échéance, signalée « en retard » d'après la date du navigateur (le
 * serveur ne connaît pas le fuseau de l'utilisateur) : calculé après
 * l'hydratation pour éviter tout écart avec le rendu serveur.
 */
export function DueBadge({ dueDate, status }: { dueDate: string | null; status: TaskStatus }) {
  const isClient = useIsClient();
  if (!dueDate) return null;
  const late = isClient && isOverdue(dueDate, status, localToday());
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-1 text-xs",
        late ? "font-medium text-danger-11" : "text-neutral-11",
      )}
    >
      <CalendarClock className="size-3.5" aria-hidden />
      <time dateTime={dueDate}>{formatDueDate(dueDate)}</time>
      {late && <span>· en retard</span>}
    </span>
  );
}

/** État + échéance d'une tâche, pour les listes. */
export function TaskMeta({ status, dueDate }: { status: TaskStatus; dueDate: string | null }) {
  return (
    <span className="flex shrink-0 items-center gap-2">
      <DueBadge dueDate={dueDate} status={status} />
      <StatusBadge status={status} />
    </span>
  );
}
