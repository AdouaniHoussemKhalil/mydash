import { Sun } from "lucide-react";
import type { Metadata } from "next";
import { EmptyState } from "@/components/EmptyState";
import { ItemDetail, ItemsView, listItems } from "@/features/items";
import { CollectionView, type ViewMode } from "@/features/shell";

export const metadata: Metadata = { title: "Aujourd'hui" };

const RECENT_LIMIT = 10;

export default function TodayPage({ searchParams }: PageProps<"/today">) {
  return (
    <CollectionView
      title="Aujourd'hui"
      description="Épinglés et récents."
      icon={<Sun />}
      searchParams={searchParams}
      renderDetail={(id) => <ItemDetail id={id} />}
      renderContent={(view, selectedId) => <TodaySections view={view} selectedId={selectedId} />}
    />
  );
}

async function TodaySections({ view, selectedId }: { view: ViewMode; selectedId: string | undefined }) {
  const [pinned, recent] = await Promise.all([
    listItems({ pinned: true }),
    listItems({ pinned: false, limit: RECENT_LIMIT }),
  ]);

  if (pinned.length === 0 && recent.length === 0) {
    return (
      <EmptyState
        icon={<Sun />}
        title="Rien pour l'instant"
        description="Tes éléments épinglés et récents apparaîtront ici. Capture quelque chose avec Ctrl+K."
      />
    );
  }

  return (
    <div className="flex flex-col gap-8">
      {pinned.length > 0 && (
        <section aria-labelledby="today-pinned" className="flex flex-col gap-3">
          <h2 id="today-pinned" className="text-sm font-medium text-neutral-11">
            Épinglés
          </h2>
          <ItemsView items={pinned} view={view} selectedId={selectedId} showType empty={null} />
        </section>
      )}
      <section aria-labelledby="today-recent" className="flex flex-col gap-3">
        <h2 id="today-recent" className="text-sm font-medium text-neutral-11">
          Récents
        </h2>
        <ItemsView
          items={recent}
          view={view}
          selectedId={selectedId}
          showType
          empty={<p className="text-sm text-neutral-11">Aucun autre élément récent.</p>}
        />
      </section>
    </div>
  );
}
