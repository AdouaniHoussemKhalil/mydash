"use client";

import frLocale from "@fullcalendar/core/locales/fr";
import dayGridPlugin from "@fullcalendar/daygrid";
import FullCalendar from "@fullcalendar/react";
import { usePathname, useRouter } from "next/navigation";
import { useMemo } from "react";
import type { DatedTask } from "@/features/items";

export type FullCalendarViewProps = {
  tasks: DatedTask[];
  selectedId?: string | undefined;
};

/**
 * Calendrier en lecture (mois / semaine) : chaque tâche à sa date
 * d'échéance. Un clic (ou Entrée) ouvre la tâche dans le panneau détail.
 */
export function FullCalendarView({ tasks, selectedId }: FullCalendarViewProps) {
  const router = useRouter();
  const pathname = usePathname();

  const events = useMemo(
    () =>
      tasks.map((task) => ({
        id: task.id,
        title: task.title,
        start: task.dueDate,
        allDay: true,
        // Un vrai lien : l'événement est focusable et suit le clavier.
        url: `${pathname}?item=${task.id}`,
        classNames: [`task-${task.status}`, ...(task.id === selectedId ? ["is-selected"] : [])],
      })),
    [tasks, selectedId, pathname],
  );

  return (
    <div className="mydash-calendar">
      <FullCalendar
        plugins={[dayGridPlugin]}
        initialView="dayGridMonth"
        locale={frLocale}
        firstDay={1}
        height="auto"
        headerToolbar={{ start: "prev,next today", center: "title", end: "dayGridMonth,dayGridWeek" }}
        events={events}
        eventDisplay="block"
        dayMaxEvents={3}
        eventClick={(info) => {
          info.jsEvent.preventDefault();
          router.replace(`${pathname}?item=${info.event.id}`, { scroll: false });
        }}
      />
    </div>
  );
}
