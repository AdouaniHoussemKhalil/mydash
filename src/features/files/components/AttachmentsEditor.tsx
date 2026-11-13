"use client";

import { Download, FileText, Trash2 } from "lucide-react";
import { useId, useState, useTransition } from "react";
import { Button, IconButton } from "@/components/ui/core";
import { toast } from "@/components/ui/overlays";
import { formatDateTime } from "@/lib/format";
import { deleteFile } from "../actions";
import { fileHref, formatBytes, type ItemFile } from "../schemas";
import { sendFile } from "../send";
import { DropZone } from "./DropZone";
import { UploadList } from "./UploadList";
import { useUploads } from "./useUploads";

export type AttachmentsEditorProps = {
  itemId: string;
  files: ItemFile[];
  /** Titre de la section (« Fichiers » par défaut). */
  label?: string | undefined;
};

/**
 * Pièces jointes d'un élément : glisser-déposer ou bouton, progression,
 * liste avec téléchargement et suppression (confirmée par un second clic).
 */
export function AttachmentsEditor({ itemId, files, label = "Fichiers" }: AttachmentsEditorProps) {
  const { uploads, run, dismiss } = useUploads();
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const headingId = useId();

  const remove = (file: ItemFile) => {
    if (confirmId !== file.id) {
      setConfirmId(file.id);
      return;
    }
    setConfirmId(null);
    startTransition(async () => {
      const result = await deleteFile(file.id);
      toast(result.ok ? { title: `« ${file.name} » supprimé` } : { title: result.error, variant: "danger" });
    });
  };

  return (
    <section aria-labelledby={headingId} className="flex flex-col gap-2">
      <h3 id={headingId} className="flex items-center gap-1.5 text-sm font-medium text-neutral-12">
        <FileText className="size-4" aria-hidden />
        {label}
      </h3>

      <DropZone onFiles={(list) => void run(list, (file, onProgress) => sendFile(itemId, file, onProgress))} />
      <UploadList uploads={uploads} onDismiss={dismiss} />

      {files.length === 0 && uploads.length === 0 ? (
        <p className="text-sm text-neutral-11">Aucun fichier pour l&apos;instant.</p>
      ) : (
        <ul className="flex flex-col divide-y divide-neutral-6 rounded-lg border border-neutral-6" aria-label={label}>
          {files.map((file) => (
            <li key={file.id} className="flex items-center gap-2 px-3 py-2">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm text-neutral-12">{file.name}</p>
                <p className="text-xs text-neutral-11">
                  {formatBytes(file.size_bytes)} · <time dateTime={file.created_at}>{formatDateTime(file.created_at)}</time>
                </p>
              </div>
              <IconButton asChild variant="ghost" size="sm" aria-label={`Télécharger ${file.name}`}>
                <a href={fileHref(file.id, true)} download={file.name}>
                  <Download className="size-4" />
                </a>
              </IconButton>
              {confirmId === file.id ? (
                <Button variant="destructive" size="sm" onClick={() => remove(file)} onBlur={() => setConfirmId(null)} autoFocus>
                  Confirmer
                </Button>
              ) : (
                <IconButton variant="ghost" size="sm" aria-label={`Supprimer ${file.name}`} onClick={() => remove(file)} disabled={isPending}>
                  <Trash2 className="size-4" />
                </IconButton>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
