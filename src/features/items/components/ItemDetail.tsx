import { EmptyState } from "@/components/EmptyState";
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
  return <ItemEditor key={item.id} item={item} />;
}
