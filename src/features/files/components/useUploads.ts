"use client";

import { useState } from "react";
import { FILE_MAX_BYTES } from "../schemas";

export type UploadEntry = { key: string; name: string; size: number; progress: number; error: string | null };

/**
 * File d'envois affichée à l'écran. `run(files, task)` traite les fichiers
 * un par un (progression lisible, actions serveur en série) ; un envoi
 * réussi disparaît de la liste, un échec y reste avec son message.
 */
export function useUploads() {
  const [uploads, setUploads] = useState<UploadEntry[]>([]);

  const patch = (key: string, values: Partial<UploadEntry>) =>
    setUploads((list) => list.map((upload) => (upload.key === key ? { ...upload, ...values } : upload)));

  const run = async (
    list: FileList | File[],
    task: (file: File, onProgress: (ratio: number) => void) => Promise<void>,
  ) => {
    const entries = Array.from(list).map((file) => ({
      file,
      upload: {
        key: crypto.randomUUID(),
        name: file.name,
        size: file.size,
        progress: 0,
        error: file.size > FILE_MAX_BYTES ? "Trop volumineux : 50 Mo maximum" : null,
      } satisfies UploadEntry,
    }));
    if (entries.length === 0) return;
    setUploads((current) => [...current, ...entries.map((entry) => entry.upload)]);

    for (const { file, upload } of entries) {
      if (upload.error) continue;
      try {
        await task(file, (progress) => patch(upload.key, { progress }));
        setUploads((current) => current.filter((item) => item.key !== upload.key));
      } catch (error) {
        patch(upload.key, { error: error instanceof Error ? error.message : "Envoi impossible" });
      }
    }
  };

  const dismiss = (key: string) => setUploads((list) => list.filter((item) => item.key !== key));

  return { uploads, run, dismiss };
}
