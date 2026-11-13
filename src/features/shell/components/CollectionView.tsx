import { type ReactNode, Suspense } from "react";
import { Skeleton } from "@/components/ui/core";
import { PageHeader } from "@/components/PageHeader";
import { parseView, type ViewMode } from "../views";
import { DetailPanel } from "./DetailPanel";
import { ViewSwitcher } from "./ViewSwitcher";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export type CollectionViewProps = {
  title: string;
  description?: string | undefined;
  icon?: ReactNode | undefined;
  searchParams: SearchParams;
  /** Contenu central selon la vue choisie, l'item sélectionné et les autres paramètres d'URL. */
  renderContent: (
    view: ViewMode,
    selectedId: string | undefined,
    params: Record<string, string | string[] | undefined>,
  ) => ReactNode;
  /** Contenu du panneau détail pour l'item sélectionné (?item=). */
  renderDetail?: ((itemId: string) => ReactNode) | undefined;
  /** Sélecteur liste / cartes / tableau (masqué pour le calendrier). */
  showViews?: boolean | undefined;
};

/**
 * Modèle d'interaction commun à toutes les pages : en-tête + sélecteur de
 * vue, liste au centre, détail à droite. L'en-tête est statique (shell
 * prérendu) ; ce qui dépend de l'URL est rendu en streaming.
 */
export function CollectionView({ searchParams, ...props }: CollectionViewProps) {
  return (
    <Suspense fallback={<CollectionSkeleton {...props} />}>
      <CollectionContent searchParams={searchParams} {...props} />
    </Suspense>
  );
}

async function CollectionContent({
  title,
  description,
  icon,
  searchParams,
  renderContent,
  renderDetail,
  showViews = true,
}: CollectionViewProps) {
  const params = await searchParams;
  const view = parseView(params.view);
  const rawItem = params.item;
  const itemId = Array.isArray(rawItem) ? rawItem[0] : rawItem;

  return (
    <>
      <main className="min-w-0 flex-1 overflow-y-auto">
        <div className="mx-auto flex max-w-5xl flex-col gap-6 px-4 py-6 md:px-6">
          <PageHeader title={title} description={description} icon={icon} actions={showViews ? <ViewSwitcher value={view} /> : undefined} />
          {renderContent(view, itemId, params)}
        </div>
      </main>
      {itemId && renderDetail && (
        <DetailPanel title="Détail">
          <Suspense fallback={<Skeleton className="h-40 w-full" />}>{renderDetail(itemId)}</Suspense>
        </DetailPanel>
      )}
    </>
  );
}

function CollectionSkeleton({ title, description, icon }: Pick<CollectionViewProps, "title" | "description" | "icon">) {
  return (
    <main className="min-w-0 flex-1 overflow-y-auto">
      <div className="mx-auto flex max-w-5xl flex-col gap-6 px-4 py-6 md:px-6">
        <PageHeader title={title} description={description} icon={icon} />
        <div className="flex flex-col gap-2" aria-busy="true" aria-label="Chargement">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      </div>
    </main>
  );
}
