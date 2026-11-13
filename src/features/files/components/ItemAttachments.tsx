import { listItemFiles } from "../queries";
import { AttachmentsEditor } from "./AttachmentsEditor";

/** Section « Fichiers » du détail : chargement serveur, édition côté client. */
export async function ItemAttachments({ itemId, label }: { itemId: string; label?: string | undefined }) {
  let files;
  try {
    files = await listItemFiles(itemId);
  } catch {
    return (
      <p role="alert" className="text-sm text-danger-11">
        Impossible de charger les fichiers. Recharge la page.
      </p>
    );
  }
  return <AttachmentsEditor itemId={itemId} files={files} label={label} />;
}
