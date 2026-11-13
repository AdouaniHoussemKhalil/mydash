import { FileText } from "lucide-react";
import { Button } from "@/components/ui/core";
import { listItemFiles } from "../queries";
import { fileHref, fileKindLabel, formatBytes, previewKind } from "../schemas";

/**
 * Aperçu du fichier principal d'un élément Fichier : image ou PDF dans la
 * page, sinon icône, type, taille et téléchargement.
 */
export async function FilePreview({ itemId }: { itemId: string }) {
  let files;
  try {
    files = await listItemFiles(itemId);
  } catch {
    return (
      <p role="alert" className="text-sm text-danger-11">
        Aperçu indisponible. Recharge la page.
      </p>
    );
  }
  const file = files[0];
  if (!file) {
    return <p className="text-sm text-neutral-11">Aucun fichier : dépose-le dans la section Fichiers ci-dessous.</p>;
  }

  const kind = previewKind(file.mime_type);
  const meta = `${fileKindLabel(file.name, file.mime_type)} · ${formatBytes(file.size_bytes)}`;

  if (kind === "image") {
    return (
      <figure className="flex flex-col gap-2">
        {/* eslint-disable-next-line @next/next/no-img-element -- URL signée courte, servie par Storage */}
        <img
          src={fileHref(file.id)}
          alt={file.name}
          className="max-h-96 w-full rounded-lg border border-neutral-6 bg-neutral-2 object-contain"
        />
        <figcaption className="text-xs text-neutral-11">{meta}</figcaption>
      </figure>
    );
  }

  if (kind === "pdf") {
    return (
      <figure className="flex flex-col gap-2">
        <iframe
          src={fileHref(file.id)}
          title={`Aperçu de ${file.name}`}
          className="h-[28rem] w-full rounded-lg border border-neutral-6 bg-neutral-2"
        />
        <figcaption className="text-xs text-neutral-11">{meta}</figcaption>
      </figure>
    );
  }

  return (
    <div className="flex items-center gap-3 rounded-lg border border-neutral-6 bg-neutral-2 p-4">
      <FileText className="size-8 shrink-0 text-neutral-11" aria-hidden />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-neutral-12">{file.name}</p>
        <p className="text-xs text-neutral-11">{meta} · pas d&apos;aperçu pour ce type</p>
      </div>
      <Button asChild size="sm" variant="outline">
        <a href={fileHref(file.id, true)} download={file.name}>
          Télécharger
        </a>
      </Button>
    </div>
  );
}
