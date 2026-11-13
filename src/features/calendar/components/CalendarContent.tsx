import { unstable_rethrow } from "next/navigation";
import { CalendarDays } from "lucide-react";
import Link from "next/link";
import { EmptyState } from "@/components/EmptyState";
import { type DatedTask, listDatedTasks } from "@/features/items";
import { TaskCalendar } from "./TaskCalendar";

/** Contenu de la page Calendrier : tâches à échéance, chargées côté serveur. */
export async function CalendarContent({ selectedId }: { selectedId: string | undefined }) {
  let tasks: DatedTask[];
  try {
    tasks = await listDatedTasks();
  } catch (error) {
    // Interruptions internes de Next (prérendu, redirection) : à laisser passer.
    unstable_rethrow(error);
    return (
      <p role="alert" className="text-sm text-danger-11">
        Impossible de charger le calendrier. Recharge la page.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {tasks.length === 0 && (
        <EmptyState
          className="py-6"
          icon={<CalendarDays />}
          title="Aucune tâche avec échéance"
          description="Donne une échéance à une tâche pour la voir ici."
          action={
            <Link href="/tasks" className="text-sm text-accent-11 hover:underline">
              Aller aux tâches
            </Link>
          }
        />
      )}
      <TaskCalendar tasks={tasks} selectedId={selectedId} />
    </div>
  );
}
