import { unstable_rethrow } from "next/navigation";
import { getRelatedLinks } from "../queries";
import { RelatedLinksEditor } from "./RelatedLinksEditor";

/** Section « Liens » du détail : chargement serveur, édition côté client. */
export async function ItemRelatedLinks({ itemId }: { itemId: string }) {
  let links;
  try {
    links = await getRelatedLinks(itemId);
  } catch (error) {
    unstable_rethrow(error);
    return (
      <p role="alert" className="text-sm text-danger-11">
        Impossible de charger les liens. Recharge la page.
      </p>
    );
  }
  return <RelatedLinksEditor itemId={itemId} links={links} />;
}
