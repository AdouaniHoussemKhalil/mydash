import { Layers } from "lucide-react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/core";
import { EmptyState } from "@/components/EmptyState";
import { PageHeader } from "@/components/PageHeader";
import { ItemDetail, ItemsView, listItems } from "@/features/items";
import { CollectionView, type ViewMode, withSearchParams } from "@/features/shell";
import { getSpace, type Space, SpaceActions, SpaceIcon } from "@/features/spaces";
import { listTags, TagFilter } from "@/features/tags";

export const metadata: Metadata = { title: "Espace" };

export default function SpacePage({ params, searchParams }: PageProps<"/spaces/[id]">) {
  return (
    <Suspense fallback={<SpaceSkeleton />}>
      <SpaceContent params={params} searchParams={searchParams} />
    </Suspense>
  );
}

async function SpaceContent({ params, searchParams }: PageProps<"/spaces/[id]">) {
  const { id } = await params;
  const space = await getSpace(id);
  if (!space) notFound();

  return (
    <CollectionView
      title={space.name}
      description="Éléments de tous types rangés dans cet Espace."
      icon={<SpaceIcon space={space} />}
      searchParams={searchParams}
      renderDetail={(itemId) => <ItemDetail id={itemId} />}
      renderContent={(view, selectedId, query) => (
        <SpaceItems
          space={space}
          view={view}
          selectedId={selectedId}
          tagId={typeof query.tag === "string" ? query.tag : undefined}
          query={query}
        />
      )}
    />
  );
}

async function SpaceItems({
  space,
  view,
  selectedId,
  tagId,
  query,
}: {
  space: Space;
  view: ViewMode;
  selectedId: string | undefined;
  tagId: string | undefined;
  query: Record<string, string | string[] | undefined>;
}) {
  const [items, tags] = await Promise.all([listItems({ spaceId: space.id, tagId }), listTags()]);
  const base = new URLSearchParams(
    Object.entries(query).flatMap(([key, value]) => (typeof value === "string" ? [[key, value]] : [])),
  );
  base.delete("item");

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <TagFilter
          tags={tags}
          activeTagId={tagId}
          hrefFor={(next) => `/spaces/${space.id}${withSearchParams(base, { tag: next })}`}
        />
        <div className="ml-auto flex gap-1">
          <SpaceActions space={space} />
        </div>
      </div>
      <ItemsView
        items={items}
        view={view}
        selectedId={selectedId}
        showType
        linkParams={tagId ? { tag: tagId } : undefined}
        empty={
          <EmptyState
            icon={<Layers />}
            title={tagId ? "Aucun élément avec ce tag ici" : "Cet Espace est vide"}
            description="Ouvre un élément et choisis « Ajouter à un Espace » dans son détail."
          />
        }
      />
    </>
  );
}

function SpaceSkeleton() {
  return (
    <main className="min-w-0 flex-1 overflow-y-auto">
      <div className="mx-auto flex max-w-5xl flex-col gap-6 px-4 py-6 md:px-6">
        <PageHeader title="Espace" icon={<Layers />} />
        <Skeleton className="h-12 w-full" />
      </div>
    </main>
  );
}
