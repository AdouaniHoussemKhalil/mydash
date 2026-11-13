"use client";

import { X } from "lucide-react";
import { useId, useState, useTransition } from "react";
import { IconButton } from "@/components/ui/core";
import { Input, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/forms";
import { toast } from "@/components/ui/overlays";
import { setTaskDetails } from "../actions";
import type { Item } from "../schemas";
import { TASK_STATUS_LABELS, TASK_STATUSES, type TaskPatch, type TaskStatus } from "../tasks";
import { DueBadge } from "./TaskMeta";

type TaskState = { status: TaskStatus; due_date: string | null };

/** État et échéance d'une tâche, enregistrés à chaque changement. */
export function TaskFields({ item }: { item: Pick<Item, "id" | "task_details"> }) {
  const fromServer: TaskState = {
    status: item.task_details?.status ?? "todo",
    due_date: item.task_details?.due_date ?? null,
  };
  const [task, setTask] = useState(fromServer);
  // Resynchronisation si le serveur renvoie d'autres valeurs.
  const [serverTask, setServerTask] = useState(fromServer);
  if (fromServer.status !== serverTask.status || fromServer.due_date !== serverTask.due_date) {
    setServerTask(fromServer);
    setTask(fromServer);
  }
  const [isPending, startTransition] = useTransition();
  const statusId = useId();
  const dueId = useId();

  const save = (patch: TaskPatch, message: string) => {
    const previous = task;
    setTask({ ...task, ...patch } as TaskState);
    startTransition(async () => {
      const result = await setTaskDetails(item.id, patch);
      if (result.ok) {
        toast({ title: message });
      } else {
        setTask(previous);
        toast({ title: result.error, variant: "danger" });
      }
    });
  };

  return (
    <section aria-label="Tâche" className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      <div className="flex flex-col gap-1.5">
        <label id={statusId} className="text-sm font-medium text-neutral-12">
          État
        </label>
        <Select
          value={task.status}
          onValueChange={(value) => save({ status: value as TaskStatus }, `État : ${TASK_STATUS_LABELS[value as TaskStatus]}`)}
          disabled={isPending}
        >
          <SelectTrigger aria-labelledby={statusId}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {TASK_STATUSES.map((status) => (
              <SelectItem key={status} value={status}>
                {TASK_STATUS_LABELS[status]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor={dueId} className="text-sm font-medium text-neutral-12">
          Échéance
        </label>
        <div className="flex items-center gap-1">
          <Input
            id={dueId}
            type="date"
            value={task.due_date ?? ""}
            onChange={(event) => {
              const value = event.target.value;
              // Saisie incomplète au clavier : attendre une date entière.
              if (value === "" || /^\d{4}-\d{2}-\d{2}$/.test(value)) {
                save({ due_date: value || null }, value ? "Échéance enregistrée" : "Échéance retirée");
              }
            }}
            disabled={isPending}
          />
          {task.due_date && (
            <IconButton variant="ghost" size="sm" aria-label="Retirer l'échéance" onClick={() => save({ due_date: null }, "Échéance retirée")}>
              <X className="size-4" />
            </IconButton>
          )}
        </div>
        <DueBadge dueDate={task.due_date} status={task.status} />
      </div>
    </section>
  );
}
