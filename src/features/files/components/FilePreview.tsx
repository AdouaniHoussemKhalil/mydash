import { unstable_rethrow } from "next/navigation";
import { Download, ExternalLink, FileText } from "lucide-react";
import { Button } from "@/components/ui/core";
import { listItemFiles } from "../queries";
import { canOpenInBrowser, fileHref, fileKindLabel, formatBytes, previewKind } from "../schemas";

/**
 * Fiche du fichier principal d'un élément Fichier : vignette (images) ou
 * icône, nom, type, taille ; « Voir » ouvre le fichier dans un nouvel onglet.
 */
export async function FilePreview({ itemId }: { itemId: string }) {
  let files;
  try {
    files = await listItemFiles(itemId);
  } catch (error) {
    unstable_rethrow(error);
    return (
      <p role="alert" className="text-sm text-danger-11">
        Fichier indisponible. Recharge la page.
      </p>
    );
  }
  const file = files[0];
  if (!file) {
    return <p className="text-sm text-neutral-11">Aucun fichier : dépose-le dans la section Fichiers ci-dessous.</p>;
  }

  const viewable = canOpenInBrowser(file.mime_type);
  const meta = `${fileKindLabel(file.name, file.mime_type)} · ${formatBytes(file.size_bytes)}`;

  return (
    <div className="flex items-center gap-3 rounded-lg border border-neutral-6 bg-neutral-1 p-3">
      {previewKind(file.mime_type) === "image" ? (
        <a
          href={fileHref(file.id)}
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0 rounded-md"
          // Raccourci souris : le bouton « Voir » fait la même chose au clavier.
          tabIndex={-1}
          aria-hidden
        >
          {/* eslint-disable-next-line @next/next/no-img-element -- URL signée courte, servie par Storage */}
          <img
            src={fileHref(file.id)}
            alt=""
            className="size-16 rounded-md border border-neutral-6 bg-neutral-1 object-cover"
          />
        </a>
      ) : (
        <FileText className="size-10 shrink-0 text-neutral-11" aria-hidden />
      )}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-neutral-12">{file.name}</p>
        <p className="text-xs text-neutral-11">{meta}</p>
      </div>
      <div className="flex shrink-0 flex-wrap justify-end gap-2">
        {viewable && (
          <Button asChild size="sm">
            <a href={fileHref(file.id)} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="size-4" />
              Voir
            </a>
          </Button>
        )}
        <Button asChild size="sm" variant="outline">
          <a href={fileHref(file.id, true)} download={file.name}>
            <Download className="size-4" />
            Télécharger
          </a>
        </Button>
      </div>
    </div>
  );
}
