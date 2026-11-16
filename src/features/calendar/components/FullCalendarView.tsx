"use client";

import frLocale from "@fullcalendar/core/locales/fr";
import dayGridPlugin from "@fullcalendar/daygrid";
import FullCalendar from "@fullcalendar/react";
import { Plus } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import type { DatedTask } from "@/features/items";
import { type CalendarNote, toDayKey } from "../schemas";
import { CalendarNoteDialog, type CalendarNoteDialogProps, formatDay } from "./CalendarNoteDialog";

export type FullCalendarViewProps = {
  tasks: DatedTask[];
  notes: CalendarNote[];
  selectedId?: string | undefined;
};

const NOTE_PREFIX = "note:";

/**
 * Calendrier (mois / semaine) : les tâches à leur échéance (un clic ouvre
 * le détail) et les petites notes écrites dans un jour (« + » du carreau ;
 * un clic sur une note la modifie ou la supprime).
 */
export function FullCalendarView({ tasks, notes, selectedId }: FullCalendarViewProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [dialog, setDialog] = useState<CalendarNoteDialogProps["target"]>(null);

  const events = useMemo(
    () => [
      // Notes d'abord : elles restent en haut du carreau.
      ...notes.map((note) => ({
        id: `${NOTE_PREFIX}${note.id}`,
        title: note.text,
        start: note.day,
        allDay: true,
        // Lien factice : l'événement est focusable au clavier (Entrée l'ouvre).
        url: `#note-${note.id}`,
        classNames: ["calendar-note"],
        extendedProps: { order: 0 },
      })),
      ...tasks.map((task) => ({
        id: task.id,
        title: task.title,
        start: task.dueDate,
        allDay: true,
        url: `${pathname}?item=${task.id}`,
        classNames: [`task-${task.status}`, ...(task.id === selectedId ? ["is-selected"] : [])],
        extendedProps: { order: 1 },
      })),
    ],
    [notes, tasks, selectedId, pathname],
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
        eventOrder="order,title"
        dayMaxEvents={4}
        dayCellClassNames="calendar-day"
        dayCellContent={(arg) => {
          const day = toDayKey(arg.date);
          return (
            <span className="flex w-full items-center justify-between gap-1">
              <button
                type="button"
                className="calendar-add"
                aria-label={`Ajouter une note le ${formatDay(day)}`}
                title="Ajouter une note"
                onClick={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  setDialog({ mode: "add", day });
                }}
              >
                <Plus aria-hidden />
              </button>
              <span>{arg.dayNumberText}</span>
            </span>
          );
        }}
        eventClick={(info) => {
          info.jsEvent.preventDefault();
          const id = info.event.id;
          if (id.startsWith(NOTE_PREFIX)) {
            const note = notes.find((candidate) => candidate.id === id.slice(NOTE_PREFIX.length));
            if (note) setDialog({ mode: "edit", note });
            return;
          }
          router.replace(`${pathname}?item=${id}`, { scroll: false });
        }}
      />
      <CalendarNoteDialog target={dialog} onClose={() => setDialog(null)} />
    </div>
  );
}
