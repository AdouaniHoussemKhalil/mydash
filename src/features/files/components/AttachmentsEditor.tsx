"use client";

import { Download, FileText, Trash2, Upload, X } from "lucide-react";
import { type DragEvent, useId, useRef, useState, useTransition } from "react";
import { Button, IconButton } from "@/components/ui/core";
import { toast } from "@/components/ui/overlays";
import { formatDateTime } from "@/lib/format";
import { cn } from "@quickadui/utils";
import { deleteFile, prepareFileUpload, registerFile } from "../actions";
import { FILE_MAX_BYTES, fileHref, formatBytes, type ItemFile } from "../schemas";
import { uploadWithProgress } from "../upload";

type Upload = { key: string; name: string; size: number; progress: number; error: string | null };

export type AttachmentsEditorProps = {
  itemId: string;
  files: ItemFile[];
  /** Titre de la section (« Fichiers » par défaut). */
  label?: string | undefined;
};

/** Envoie un fichier : URL signée → envoi direct à Storage → enregistrement. */
async function sendFile(itemId: string, file: File, onProgress: (ratio: number) => void) {
  const info = { name: file.name, size: file.size, mimeType: file.type };
  const prepared = await prepareFileUpload(itemId, info);
  if (!prepared.ok) throw new Error(prepared.error);
  await uploadWithProgress(prepared.data.signedUrl, file, onProgress);
  const registered = await registerFile(itemId, prepared.data.fileId, info);
  if (!registered.ok) throw new Error(registered.error);
}

/**
 * Pièces jointes d'un élément : glisser-déposer ou bouton, progression,
 * liste avec téléchargement et suppression (confirmée par un second clic).
 */
export function AttachmentsEditor({ itemId, files, label = "Fichiers" }: AttachmentsEditorProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploads, setUploads] = useState<Upload[]>([]);
  const [dragging, setDragging] = useState(false);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const headingId = useId();

  const patchUpload = (key: string, patch: Partial<Upload>) =>
    setUploads((list) => list.map((upload) => (upload.key === key ? { ...upload, ...patch } : upload)));

  const addFiles = async (list: FileList | File[]) => {
    const selected = Array.from(list);
    if (selected.length === 0) return;
    const entries = selected.map((file) => ({
      file,
      upload: {
        key: crypto.randomUUID(),
        name: file.name,
        size: file.size,
        progress: 0,
        error: file.size > FILE_MAX_BYTES ? "Trop volumineux : 50 Mo maximum" : null,
      } satisfies Upload,
    }));
    setUploads((current) => [...current, ...entries.map((entry) => entry.upload)]);

    // Un fichier à la fois : progression lisible, actions serveur en série.
    for (const { file, upload } of entries) {
      if (upload.error) continue;
      try {
        await sendFile(itemId, file, (progress) => patchUpload(upload.key, { progress }));
        setUploads((current) => current.filter((item) => item.key !== upload.key));
      } catch (error) {
        patchUpload(upload.key, { error: error instanceof Error ? error.message : "Envoi impossible" });
      }
    }
  };

  const onDrop = (event: DragEvent) => {
    event.preventDefault();
    setDragging(false);
    if (event.dataTransfer.files.length > 0) void addFiles(event.dataTransfer.files);
  };

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

      <div
        onDragOver={(event) => {
          event.preventDefault();
          event.dataTransfer.dropEffect = "copy";
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        className={cn(
          "flex flex-col items-center gap-2 rounded-lg border border-dashed border-neutral-7 px-4 py-5 text-center transition-colors",
          dragging && "border-accent-8 bg-accent-2",
        )}
      >
        <Upload className="size-5 text-neutral-11" aria-hidden />
        <p className="text-sm text-neutral-11">Glisse des fichiers ici (50 Mo maximum chacun)</p>
        <Button type="button" variant="outline" size="sm" onClick={() => inputRef.current?.click()}>
          Choisir des fichiers
        </Button>
        <input
          ref={inputRef}
          type="file"
          multiple
          className="sr-only"
          tabIndex={-1}
          aria-hidden
          onChange={(event) => {
            if (event.target.files) void addFiles(event.target.files);
            event.target.value = "";
          }}
        />
      </div>

      {uploads.length > 0 && (
        <ul className="flex flex-col gap-2" aria-label="Envois en cours">
          {uploads.map((upload) => (
            <li key={upload.key} className="flex flex-col gap-1 rounded-md border border-neutral-6 px-3 py-2">
              <div className="flex items-center gap-2 text-sm">
                <span className="min-w-0 flex-1 truncate text-neutral-12">{upload.name}</span>
                <span className="shrink-0 text-xs text-neutral-11">{formatBytes(upload.size)}</span>
                {upload.error && (
                  <IconButton
                    variant="ghost"
                    size="sm"
                    aria-label={`Retirer ${upload.name} de la liste`}
                    onClick={() => setUploads((list) => list.filter((item) => item.key !== upload.key))}
                  >
                    <X className="size-4" />
                  </IconButton>
                )}
              </div>
              {upload.error ? (
                <p role="alert" className="text-xs text-danger-11">
                  {upload.error}
                </p>
              ) : (
                <div
                  role="progressbar"
                  aria-label={`Envoi de ${upload.name}`}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={Math.round(upload.progress * 100)}
                  className="h-1.5 overflow-hidden rounded-full bg-neutral-4"
                >
                  <div className="h-full bg-accent-9 transition-[width]" style={{ width: `${upload.progress * 100}%` }} />
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

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
