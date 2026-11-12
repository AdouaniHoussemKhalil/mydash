import { Sun } from "lucide-react";
import type { Metadata } from "next";
import { EmptyState } from "@/components/EmptyState";
import { CollectionView } from "@/features/shell";

export const metadata: Metadata = { title: "Aujourd'hui" };

export default function TodayPage({ searchParams }: PageProps<"/today">) {
  return (
    <CollectionView
      title="Aujourd'hui"
      description="Épinglés, à lire et récents."
      icon={<Sun />}
      searchParams={searchParams}
      renderContent={() => (
        <EmptyState
          icon={<Sun />}
          title="Rien pour l'instant"
          description="Tes éléments épinglés et récents apparaîtront ici. Capture quelque chose avec Ctrl+K."
        />
      )}
    />
  );
}
