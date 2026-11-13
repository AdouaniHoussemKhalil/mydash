import { Archive } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { type ReactNode, Suspense } from "react";
import { Skeleton } from "@/components/ui/core";
import { EmptyState } from "@/components/EmptyState";
import { FileDropCreate } from "@/features/files";
import {
  createItem,
  ItemDetail,
  ItemsView,
  listItems,
  QuickCreate,
  TASK_STATUS_LABELS,
  type TaskStatus,
  TaskStatusFilter,
  taskStatusSchema,
} from "@/features/items";
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

// Modules ayant leur propre page (route statique prioritaire).
const DEDICATED_PAGES = new Set(["calendar"]);

// Modules connus prérendus ; tout autre segment → notFound() plus bas.
export function generateStaticParams() {
  return MODULES.filter(({ slug }) => !DEDICATED_PAGES.has(slug)).map(({ slug }) => ({ module: slug }));
}

export async function generateMetadata({ params }: PageProps<"/[module]">): Promise<Metadata> {
  const { module: slug } = await params;
  return { title: getModule(slug)?.label ?? "Introuvable" };
}

// params est lu sous Suspense : la coquille de la page ne dépend pas de l'URL
// (prérendu partagé par tous les modules, navigation instantanée).
export default function ModulePage({ params, searchParams }: PageProps<"/[module]">) {
  return (
    <Suspense fallback={<ModuleSkeleton />}>
      <ModuleContent params={params} searchParams={searchParams} />
    </Suspense>
  );
}

function ModuleSkeleton() {
  return (
    <main className="min-w-0 flex-1 overflow-y-auto">
      <div className="mx-auto flex max-w-5xl flex-col gap-6 px-4 py-6 md:px-6" aria-busy="true" aria-label="Chargement">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
      </div>
    </main>
  );
}

async function ModuleContent({ params, searchParams }: PageProps<"/[module]">) {
  const { module: slug } = await params;
  const definition = MODULES.find((module) => module.slug === slug);
  if (!definition || DEDICATED_PAGES.has(definition.slug)) notFound();

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
        const taskStatus =
          definition.type === "task" ? taskStatusSchema.safeParse(query.status).data : undefined;
        return (
          <>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
              <div className="flex-1">
                {!archived &&
                  (definition.type === "file" ? (
                    <FileDropCreate createItem={createItem} />
                  ) : (
                    <QuickCreate type={definition.type} itemLabel={definition.itemLabel} />
                  ))}
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
              taskStatus={taskStatus}
              empty={
                archived ? (
                  <EmptyState icon={<Archive />} title="Aucun élément archivé" />
                ) : (
                  <EmptyState
                    icon={<Icon />}
                    title={`Aucun élément dans ${definition.label}`}
                    description={
                      definition.type === "file"
                        ? "Dépose des fichiers ci-dessus : chacun devient un élément."
                        : "Tape un titre ci-dessus, ou capture depuis n'importe où avec Ctrl+K."
                    }
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
  taskStatus,
  empty,
}: {
  definition: ModuleDef;
  view: ViewMode;
  selectedId: string | undefined;
  archived: boolean;
  tagId: string | undefined;
  taskStatus: TaskStatus | undefined;
  empty: ReactNode;
}) {
  const [items, tags] = await Promise.all([
    listItems({ type: definition.type, archived, tagId, taskStatus }),
    listTags(),
  ]);
  const keep: Record<string, string> = {};
  if (archived) keep.archived = "1";
  if (tagId) keep.tag = tagId;
  if (taskStatus) keep.status = taskStatus;
  if (view !== "list") keep.view = view;
  return (
    <>
      {definition.type === "task" && (
        <TaskStatusFilter
          active={taskStatus}
          hrefFor={(next) => `/${definition.slug}${withSearchParams(new URLSearchParams(keep), { status: next })}`}
        />
      )}
      <TagFilter
        tags={tags}
        activeTagId={tagId}
        hrefFor={(next) => `/${definition.slug}${withSearchParams(new URLSearchParams(keep), { tag: next })}`}
      />
      <ItemsView
        items={items}
        view={view}
        selectedId={selectedId}
        empty={
          tagId ? (
            <EmptyState title="Aucun élément avec ce tag" />
          ) : taskStatus ? (
            <EmptyState title={`Aucune tâche « ${TASK_STATUS_LABELS[taskStatus].toLowerCase()} »`} />
          ) : (
            empty
          )
        }
        linkParams={Object.keys(keep).length ? keep : undefined}
      />
    </>
  );
}
