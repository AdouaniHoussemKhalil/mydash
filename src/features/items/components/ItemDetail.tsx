import { Pin } from "lucide-react";
import { EmptyState } from "@/components/EmptyState";
import { formatDateTime } from "@/lib/format";
import { getItem } from "../queries";
import { DeleteItemButton } from "./DeleteItemButton";
import { ItemTypeBadge } from "./ItemTypeBadge";

/** Contenu du panneau détail. L'édition en place arrive avec #8. */
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

  return (
    <article className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center gap-2">
        <ItemTypeBadge type={item.type} />
        {item.pinned && (
          <span className="inline-flex items-center gap-1 text-xs text-accent-11">
            <Pin className="size-3" aria-hidden /> Épinglé
          </span>
        )}
        {item.in_inbox && <span className="text-xs text-neutral-11">Dans l&apos;Inbox</span>}
      </div>

      <h3 className="text-lg font-semibold break-words text-neutral-12">{item.title}</h3>

      {item.body ? (
        <div className="text-sm whitespace-pre-wrap break-words text-neutral-12">{item.body}</div>
      ) : (
        <p className="text-sm text-neutral-11">Pas encore de contenu.</p>
      )}

      <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 border-t border-neutral-6 pt-4 text-xs text-neutral-11">
        <dt>Créé</dt>
        <dd>
          <time dateTime={item.created_at}>{formatDateTime(item.created_at)}</time>
        </dd>
        <dt>Modifié</dt>
        <dd>
          <time dateTime={item.updated_at}>{formatDateTime(item.updated_at)}</time>
        </dd>
      </dl>

      <div className="flex justify-end">
        <DeleteItemButton id={item.id} title={item.title} />
      </div>
    </article>
  );
}
