import { Search } from "lucide-react";
import type { Metadata } from "next";
import { EmptyState } from "@/components/EmptyState";
import { ItemDetail } from "@/features/items";
import { CollectionView } from "@/features/shell";

export const metadata: Metadata = { title: "Recherche" };

export default function SearchPage({ searchParams }: PageProps<"/search">) {
  return (
    <CollectionView
      title="Recherche"
      description="Recherche plein texte sur tous tes éléments."
      icon={<Search />}
      searchParams={searchParams}
      renderDetail={(id) => <ItemDetail id={id} />}
      renderContent={() => (
        <EmptyState
          icon={<Search />}
          title="Recherche globale"
          description="La recherche plein texte, avec filtres par type, tag et Espace, arrive en Phase 1."
        />
      )}
    />
  );
}
