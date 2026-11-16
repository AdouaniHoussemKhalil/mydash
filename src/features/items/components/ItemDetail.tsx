import { Suspense } from "react";
import { Skeleton } from "@/components/ui/core";
import { EmptyState } from "@/components/EmptyState";
import { FilePreview, ItemAttachments } from "@/features/files";
import { ItemRepoActivity } from "@/features/repos";
import { getItemSpaces, ItemSpacesEditor, listSpaces } from "@/features/spaces";
import { getItemTags, ItemTagsEditor, listTags } from "@/features/tags";
import { getItem } from "../queries";
import { ItemEditor } from "./ItemEditor";
import { ItemRelatedLinks } from "./ItemRelatedLinks";

/** Types dont le détail propose des pièces jointes. */
const ATTACHMENT_TYPES = new Set(["file", "doc", "prompt", "skill"]);
/** Types dont le détail propose des liens attachés. */
const RELATED_LINK_TYPES = new Set(["doc", "prompt", "skill"]);

/** Contenu du panneau détail : chargement serveur, édition en place côté client. */
export async function ItemDetail({ id }: { id: string }) {
  const item = await getItem(id);
  if (!item) {
    return (
      <EmptyState
        title="Élément introuvable"
        description="Il a peut-être été supprimé, ou le lien est incorrect."
      />
    );
  }

  const [tags, allTags, spaces, allSpaces] = await Promise.all([
    getItemTags(item.id),
    listTags(),
    getItemSpaces(item.id),
    listSpaces(),
  ]);

  return (
    <ItemEditor
      key={item.id}
      item={item}
      preview={
        item.type === "file" ? (
          <Suspense fallback={<Skeleton className="h-48 w-full" />}>
            <FilePreview itemId={item.id} />
          </Suspense>
        ) : undefined
      }
      relations={
        <div className="flex flex-col gap-4">
          {item.type === "repo" && (
            <Suspense fallback={<Skeleton className="h-40 w-full" />}>
              {/* L'URL fait partie de la clé : la changer recharge l'activité. */}
              <ItemRepoActivity key={item.url ?? "none"} itemId={item.id} url={item.url} />
            </Suspense>
          )}
          {ATTACHMENT_TYPES.has(item.type) && (
            <Suspense fallback={<Skeleton className="h-28 w-full" />}>
              <ItemAttachments itemId={item.id} />
            </Suspense>
          )}
          {RELATED_LINK_TYPES.has(item.type) && (
            <Suspense fallback={<Skeleton className="h-20 w-full" />}>
              <ItemRelatedLinks itemId={item.id} />
            </Suspense>
          )}
          <ItemTagsEditor key={`tags-${item.id}`} itemId={item.id} tags={tags} allTags={allTags} />
          <ItemSpacesEditor key={`spaces-${item.id}`} itemId={item.id} spaces={spaces} allSpaces={allSpaces} />
        </div>
      }
    />
  );
}
