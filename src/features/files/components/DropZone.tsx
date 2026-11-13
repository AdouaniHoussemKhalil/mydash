"use client";

import { Upload } from "lucide-react";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/core";
import { cn } from "@quickadui/utils";

export type DropZoneProps = {
  onFiles: (files: FileList) => void;
  hint?: string | undefined;
  buttonLabel?: string | undefined;
  className?: string | undefined;
};

/** Zone de dépôt : glisser-déposer, ou bouton qui ouvre le sélecteur de fichiers. */
export function DropZone({
  onFiles,
  hint = "Glisse des fichiers ici (50 Mo maximum chacun)",
  buttonLabel = "Choisir des fichiers",
  className,
}: DropZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  return (
    <div
      onDragOver={(event) => {
        event.preventDefault();
        event.dataTransfer.dropEffect = "copy";
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(event) => {
        event.preventDefault();
        setDragging(false);
        if (event.dataTransfer.files.length > 0) onFiles(event.dataTransfer.files);
      }}
      className={cn(
        "flex flex-col items-center gap-2 rounded-lg border border-dashed border-neutral-7 px-4 py-5 text-center transition-colors",
        dragging && "border-accent-8 bg-accent-2",
        className,
      )}
    >
      <Upload className="size-5 text-neutral-11" aria-hidden />
      <p className="text-sm text-neutral-11">{hint}</p>
      <Button type="button" variant="outline" size="sm" onClick={() => inputRef.current?.click()}>
        {buttonLabel}
      </Button>
      <input
        ref={inputRef}
        type="file"
        multiple
        className="sr-only"
        tabIndex={-1}
        aria-hidden
        onChange={(event) => {
          if (event.target.files?.length) onFiles(event.target.files);
          event.target.value = "";
        }}
      />
    </div>
  );
}
