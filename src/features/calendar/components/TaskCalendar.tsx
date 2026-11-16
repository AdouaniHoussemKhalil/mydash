"use client";

import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/core";
import type { FullCalendarViewProps } from "./FullCalendarView";

// FullCalendar mesure le DOM : rendu côté navigateur uniquement.
const FullCalendarView = dynamic(() => import("./FullCalendarView").then((module) => module.FullCalendarView), {
  ssr: false,
  loading: () => <Skeleton className="h-[36rem] w-full" aria-label="Chargement du calendrier" />,
});

export function TaskCalendar(props: FullCalendarViewProps) {
  return <FullCalendarView {...props} />;
}
