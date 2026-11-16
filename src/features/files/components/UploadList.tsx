"use client";

import { X } from "lucide-react";
import { IconButton } from "@/components/ui/core";
import { formatBytes } from "../schemas";
import type { UploadEntry } from "./useUploads";

/** Envois en cours : barre de progression, ou message d'erreur à retirer. */
export function UploadList({ uploads, onDismiss }: { uploads: UploadEntry[]; onDismiss: (key: string) => void }) {
  if (uploads.length === 0) return null;
  return (
    <ul className="flex flex-col gap-2" aria-label="Envois en cours">
      {uploads.map((upload) => (
        <li key={upload.key} className="flex flex-col gap-1 rounded-md border border-neutral-6 px-3 py-2">
          <div className="flex items-center gap-2 text-sm">
            <span className="min-w-0 flex-1 truncate text-neutral-12">{upload.name}</span>
            <span className="shrink-0 text-xs text-neutral-11">{formatBytes(upload.size)}</span>
            {upload.error && (
              <IconButton variant="ghost" size="sm" aria-label={`Retirer ${upload.name} de la liste`} onClick={() => onDismiss(upload.key)}>
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
  );
}
