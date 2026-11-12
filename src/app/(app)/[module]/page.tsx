import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { EmptyState } from "@/components/EmptyState";
import { ItemDetail, ItemsView, listItems, QuickCreate } from "@/features/items";
import { CollectionView, getModule, MODULE_ICONS, MODULES, type ViewMode } from "@/features/shell";

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
      renderContent={(view, selectedId) => (
        <>
          <QuickCreate type={definition.type} itemLabel={definition.itemLabel} />
          <ModuleItems
            type={definition.type}
            view={view}
            selectedId={selectedId}
            empty={
              <EmptyState
                icon={<Icon />}
                title={`Aucun élément dans ${definition.label}`}
                description="Tape un titre ci-dessus, ou capture depuis n'importe où avec Ctrl+K."
              />
            }
          />
        </>
      )}
      renderDetail={(id) => <ItemDetail id={id} />}
    />
  );
}

async function ModuleItems({
  type,
  view,
  selectedId,
  empty,
}: {
  type: (typeof MODULES)[number]["type"];
  view: ViewMode;
  selectedId: string | undefined;
  empty: React.ReactNode;
}) {
  const items = await listItems({ type });
  return <ItemsView items={items} view={view} selectedId={selectedId} empty={empty} />;
}
