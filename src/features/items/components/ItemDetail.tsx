import { EmptyState } from "@/components/EmptyState";
import { getItemSpaces, ItemSpacesEditor, listSpaces } from "@/features/spaces";
import { getItemTags, ItemTagsEditor, listTags } from "@/features/tags";
import { getItem } from "../queries";
import { ItemEditor } from "./ItemEditor";

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
      relations={
        <div className="flex flex-col gap-4">
          <ItemTagsEditor key={`tags-${item.id}`} itemId={item.id} tags={tags} allTags={allTags} />
          <ItemSpacesEditor key={`spaces-${item.id}`} itemId={item.id} spaces={spaces} allSpaces={allSpaces} />
        </div>
      }
    />
  );
}
