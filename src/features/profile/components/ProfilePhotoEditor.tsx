"use client";

import { Camera, Trash2 } from "lucide-react";
import { useRef, useState, useTransition } from "react";
import { Button } from "@/components/ui/core";
import { toast } from "@/components/ui/overlays";
import { preparePhotoUpload, removeProfilePhoto, setProfilePhoto } from "../actions";
import { initials, PHOTO_TYPES, photoInfoSchema } from "../schemas";

export type ProfilePhotoEditorProps = {
  hasPhoto: boolean;
  /** Change à chaque mise à jour du profil : force le rechargement de l'image. */
  version: string;
  fullName: string;
};

/** Photo de profil : affichage carré arrondi, envoi, remplacement, retrait. */
export function ProfilePhotoEditor({ hasPhoto, version, fullName }: ProfilePhotoEditorProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const upload = (file: File) => {
    const info = { mimeType: file.type, size: file.size };
    const parsed = photoInfoSchema.safeParse(info);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Photo invalide");
      return;
    }
    setError(null);
    startTransition(async () => {
      const prepared = await preparePhotoUpload(info);
      if (!prepared.ok) {
        setError(prepared.error);
        return;
      }
      const response = await fetch(prepared.data.signedUrl, {
        method: "PUT",
        headers: { "content-type": file.type },
        body: file,
      }).catch(() => null);
      if (!response?.ok) {
        setError("Envoi de la photo impossible. Réessaie.");
        return;
      }
      const result = await setProfilePhoto(prepared.data.path);
      if (!result.ok) setError(result.error);
      else toast({ title: "Photo enregistrée" });
    });
  };

  const remove = () => {
    startTransition(async () => {
      const result = await removeProfilePhoto();
      toast(result.ok ? { title: "Photo retirée" } : { title: result.error, variant: "danger" });
    });
  };

  return (
    <div className="flex items-center gap-4">
      {hasPhoto ? (
        // eslint-disable-next-line @next/next/no-img-element -- URL signée courte (route /api/profile/photo)
        <img
          src={`/api/profile/photo?v=${encodeURIComponent(version)}`}
          alt="Photo de profil"
          className="size-24 shrink-0 rounded-full border border-neutral-6 bg-neutral-2 object-cover"
        />
      ) : (
        <div
          aria-hidden
          className="flex size-24 shrink-0 items-center justify-center rounded-full border border-neutral-6 bg-accent-3 text-2xl font-semibold text-accent-11"
        >
          {initials(fullName)}
        </div>
      )}
      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" size="sm" onClick={() => inputRef.current?.click()} disabled={isPending}>
            <Camera className="size-4" />
            {hasPhoto ? "Changer la photo" : "Ajouter une photo"}
          </Button>
          {hasPhoto && (
            <Button type="button" variant="ghost" size="sm" onClick={remove} disabled={isPending}>
              <Trash2 className="size-4" />
              Retirer
            </Button>
          )}
        </div>
        <p className="text-xs text-neutral-11">{isPending ? "Envoi…" : "JPG, PNG ou WebP, 5 Mo maximum."}</p>
        {error && (
          <p role="alert" className="text-xs text-danger-11">
            {error}
          </p>
        )}
        <input
          ref={inputRef}
          type="file"
          accept={Object.keys(PHOTO_TYPES).join(",")}
          className="sr-only"
          tabIndex={-1}
          aria-hidden
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) upload(file);
            event.target.value = "";
          }}
        />
      </div>
    </div>
  );
}
