"use client";

import { usePathname, useRouter } from "next/navigation";
import type { ActionResult } from "@/lib/action-result";
import { sendFile } from "../send";
import { DropZone } from "./DropZone";
import { UploadList } from "./UploadList";
import { useUploads } from "./useUploads";

export type FileDropCreateProps = {
  /** Action serveur de création d'item (fournie par la page). */
  createItem: (input: { type: "file"; title: string }) => Promise<ActionResult<{ id: string }>>;
};

/**
 * Page Fichiers : chaque fichier déposé devient un élément (titre = nom du
 * fichier) avec ce fichier attaché ; le détail du dernier s'ouvre ensuite.
 */
export function FileDropCreate({ createItem }: FileDropCreateProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { uploads, run, dismiss } = useUploads();

  const onFiles = async (list: FileList) => {
    let lastId: string | null = null;
    await run(list, async (file, onProgress) => {
      const created = await createItem({ type: "file", title: file.name.slice(0, 500) || "Fichier" });
      if (!created.ok) throw new Error(created.error);
      await sendFile(created.data.id, file, onProgress);
      lastId = created.data.id;
    });
    if (lastId) {
      const params = new URLSearchParams(window.location.search);
      params.set("item", lastId);
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <DropZone
        onFiles={(list) => void onFiles(list)}
        hint="Glisse tes fichiers ici : chacun devient un élément (50 Mo maximum)"
        buttonLabel="Ajouter des fichiers"
      />
      <UploadList uploads={uploads} onDismiss={dismiss} />
    </div>
  );
}
