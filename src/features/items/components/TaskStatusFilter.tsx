import Link from "next/link";
import { cn } from "@quickadui/utils";
import { TASK_STATUS_LABELS, TASK_STATUSES, type TaskStatus } from "../tasks";

export type TaskStatusFilterProps = {
  active: TaskStatus | undefined;
  /** URL pour un état (null = toutes les tâches). */
  hrefFor: (status: TaskStatus | null) => string;
};

/** Filtre des tâches par état. */
export function TaskStatusFilter({ active, hrefFor }: TaskStatusFilterProps) {
  const options: [TaskStatus | null, string][] = [
    [null, "Toutes"],
    ...TASK_STATUSES.map((status): [TaskStatus, string] => [status, TASK_STATUS_LABELS[status]]),
  ];
  return (
    <nav aria-label="Filtrer par état" className="flex flex-wrap items-center gap-1.5">
      {options.map(([status, label]) => {
        const current = (status ?? undefined) === active;
        return (
          <Link
            key={label}
            href={hrefFor(status)}
            scroll={false}
            aria-current={current ? "page" : undefined}
            className={cn(
              "rounded-full border px-3 py-1 text-xs transition-colors focus-visible:outline-2 focus-visible:outline-accent-8",
              current
                ? "border-accent-8 bg-accent-3 text-accent-11"
                : "border-neutral-6 text-neutral-11 hover:border-neutral-8 hover:text-neutral-12",
            )}
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
