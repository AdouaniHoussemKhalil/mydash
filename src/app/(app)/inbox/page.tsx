import { Inbox } from "lucide-react";
import type { Metadata } from "next";
import { EmptyState } from "@/components/EmptyState";
import { ItemDetail } from "@/features/items";
import { CollectionView } from "@/features/shell";

export const metadata: Metadata = { title: "Inbox" };

export default function InboxPage({ searchParams }: PageProps<"/inbox">) {
  return (
    <CollectionView
      title="Inbox"
      description="Éléments capturés, pas encore classés."
      icon={<Inbox />}
      searchParams={searchParams}
      renderDetail={(id) => <ItemDetail id={id} />}
      renderContent={() => (
        <EmptyState
          icon={<Inbox />}
          title="Inbox vide"
          description="Tout ce que tu captures arrive ici jusqu'à ce que tu le ranges dans un Espace."
        />
      )}
    />
  );
}
