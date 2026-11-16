import { CalendarDays } from "lucide-react";
import type { Metadata } from "next";
import { CalendarContent } from "@/features/calendar";
import { ItemDetail } from "@/features/items";
import { CollectionView } from "@/features/shell";

export const metadata: Metadata = { title: "Calendrier" };

/** Calendrier en lecture : les tâches à leur date d'échéance. */
export default function CalendarPage({ searchParams }: PageProps<"/calendar">) {
  return (
    <CollectionView
      title="Calendrier"
      description="Tes tâches à leur date d'échéance."
      icon={<CalendarDays />}
      searchParams={searchParams}
      showViews={false}
      renderDetail={(id) => <ItemDetail id={id} />}
      renderContent={(_view, selectedId) => <CalendarContent selectedId={selectedId} />}
    />
  );
}
