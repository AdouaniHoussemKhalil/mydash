import { Archive } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { EmptyState } from "@/components/EmptyState";
import { ItemDetail, ItemsView, listItems, QuickCreate } from "@/features/items";
import { listTags, TagFilter } from "@/features/tags";
import {
  CollectionView,
  getModule,
  MODULE_ICONS,
  MODULES,
  type ModuleDef,
  type ViewMode,
  withSearchParams,
} from "@/features/shell";

// Modules connus prérendus ; tout autre segment → notFound() plus bas.
export function generateStaticParams() {
  return MODULES.map(({ slug }) => ({ module: slug }));
}

export async function generateMetadata({ params }: PageProps<"/[module]">): Promise<Metadata> {
  const { module: slug } = await params;
  return { title: getModule(slug)?.label ?? "Introuvable" };
}

export default async function ModulePage({ params, searchParams }: PageProps<"/[module]">) {
  const { module: slug } = await params;
  const definition = MODULES.find((module) => module.slug === slug);
  if (!definition) notFound();

  const Icon = MODULE_ICONS[definition.slug];

  return (
    <CollectionView
      title={definition.label}
      description={definition.description}
      icon={<Icon />}
      searchParams={searchParams}
      renderDetail={(id) => <ItemDetail id={id} />}
      renderContent={(view, selectedId, query) => {
        const archived = query.archived === "1";
        const tagId = typeof query.tag === "string" ? query.tag : undefined;
        return (
          <>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
              <div className="flex-1">
                {!archived && <QuickCreate type={definition.type} itemLabel={definition.itemLabel} />}
                {archived && <p className="text-sm text-neutral-11">Éléments archivés de {definition.label}.</p>}
              </div>
              <Link
                href={archived ? `/${definition.slug}` : `/${definition.slug}?archived=1`}
                className="inline-flex items-center gap-1.5 self-start rounded-md px-2 py-2 text-sm text-neutral-11 hover:bg-neutral-3 hover:text-neutral-12"
              >
                <Archive className="size-4" aria-hidden />
                {archived ? "Retour aux éléments actifs" : "Archives"}
              </Link>
            </div>
            <ModuleItems
              definition={definition}
              view={view}
              selectedId={selectedId}
              archived={archived}
              tagId={tagId}
              empty={
                archived ? (
                  <EmptyState icon={<Archive />} title="Aucun élément archivé" />
                ) : (
                  <EmptyState
                    icon={<Icon />}
                    title={`Aucun élément dans ${definition.label}`}
                    description="Tape un titre ci-dessus, ou capture depuis n'importe où avec Ctrl+K."
                  />
                )
              }
            />
          </>
        );
      }}
    />
  );
}

async function ModuleItems({
  definition,
  view,
  selectedId,
  archived,
  tagId,
  empty,
}: {
  definition: ModuleDef;
  view: ViewMode;
  selectedId: string | undefined;
  archived: boolean;
  tagId: string | undefined;
  empty: ReactNode;
}) {
  const [items, tags] = await Promise.all([
    listItems({ type: definition.type, archived, tagId }),
    listTags(),
  ]);
  const keep: Record<string, string> = {};
  if (archived) keep.archived = "1";
  if (tagId) keep.tag = tagId;
  if (view !== "list") keep.view = view;
  return (
    <>
      <TagFilter
        tags={tags}
        activeTagId={tagId}
        hrefFor={(next) => `/${definition.slug}${withSearchParams(new URLSearchParams(keep), { tag: next })}`}
      />
      <ItemsView
        items={items}
        view={view}
        selectedId={selectedId}
        empty={tagId ? <EmptyState title="Aucun élément avec ce tag" /> : empty}
        linkParams={Object.keys(keep).length ? keep : undefined}
      />
    </>
  );
}
