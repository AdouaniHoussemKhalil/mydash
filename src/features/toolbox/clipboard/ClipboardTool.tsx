import { unstable_rethrow } from "next/navigation";
import { getSharedClipboard } from "./queries";
import type { SharedClipboard } from "./schemas";
import { SharedClipboardEditor } from "./SharedClipboardEditor";

/** Presse-papiers partagé : chargé côté serveur, édité côté navigateur. */
export async function ClipboardTool() {
  let initial: SharedClipboard;
  try {
    initial = await getSharedClipboard();
  } catch (error) {
    unstable_rethrow(error);
    return (
      <p role="alert" className="text-sm text-danger-11">
        Impossible de charger le presse-papiers. Recharge la page.
      </p>
    );
  }
  return <SharedClipboardEditor initial={initial} />;
}
