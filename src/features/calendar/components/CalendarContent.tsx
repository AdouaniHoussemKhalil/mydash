import { unstable_rethrow } from "next/navigation";
import { type DatedTask, listDatedTasks } from "@/features/items";
import { listCalendarNotes } from "../queries";
import type { CalendarNote } from "../schemas";
import { TaskCalendar } from "./TaskCalendar";

/** Contenu de la page Calendrier : tâches à échéance et notes, chargées côté serveur. */
export async function CalendarContent({ selectedId }: { selectedId: string | undefined }) {
  let tasks: DatedTask[];
  let notes: CalendarNote[];
  try {
    [tasks, notes] = await Promise.all([listDatedTasks(), listCalendarNotes()]);
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
    <div className="flex flex-col gap-3">
      <p className="text-sm text-neutral-11">
        Survole un jour et clique sur « + » pour y écrire une note. Les tâches avec échéance s&apos;affichent aussi.
      </p>
      <TaskCalendar tasks={tasks} notes={notes} selectedId={selectedId} />
    </div>
  );
}
