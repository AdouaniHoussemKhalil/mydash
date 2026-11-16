import { Inbox } from "lucide-react";
import type { Metadata } from "next";
import { EmptyState } from "@/components/EmptyState";
import { ItemDetail, ItemsView, listItems } from "@/features/items";
import { CollectionView, type ViewMode } from "@/features/shell";

export const metadata: Metadata = { title: "Inbox" };

export default function InboxPage({ searchParams }: PageProps<"/inbox">) {
  return (
    <CollectionView
      title="Inbox"
      description="Éléments capturés, pas encore classés."
      icon={<Inbox />}
      searchParams={searchParams}
      renderDetail={(id) => <ItemDetail id={id} />}
      renderContent={(view, selectedId) => <InboxItems view={view} selectedId={selectedId} />}
    />
  );
}

async function InboxItems({ view, selectedId }: { view: ViewMode; selectedId: string | undefined }) {
  const items = await listItems({ inbox: true });
  return (
    <ItemsView
      items={items}
      view={view}
      selectedId={selectedId}
      showType
      empty={
        <EmptyState
          icon={<Inbox />}
          title="Inbox vide"
          description="Tout ce que tu captures arrive ici. Utilise « Classer » dans le détail pour l'en sortir."
        />
      }
    />
  );
}
