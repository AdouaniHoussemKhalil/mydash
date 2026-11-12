import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { EmptyState } from "@/components/EmptyState";
import { CollectionView, getModule, MODULE_ICONS, MODULES } from "@/features/shell";

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
      renderContent={() => (
        <EmptyState
          icon={<Icon />}
          title={`Aucun élément dans ${definition.label}`}
          description="Capture ton premier élément avec Ctrl+K."
        />
      )}
    />
  );
}
