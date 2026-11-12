"use client";

import { Check, ExternalLink, Undo2 } from "lucide-react";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/core";
import { Input } from "@/components/ui/forms";
import { toast } from "@/components/ui/overlays";
import { setLinkRead, updateItem } from "../actions";
import { type Item, isRead, urlSchema } from "../schemas";

/**
 * Champs propres à un lien dans le détail : URL (enregistrée à la sortie du
 * champ ou sur Entrée), ouverture du site et statut à lire / lu.
 */
export function LinkFields({ item }: { item: Pick<Item, "id" | "url" | "link_meta"> }) {
  const [url, setUrl] = useState(item.url ?? "");
  const [savedUrl, setSavedUrl] = useState(item.url);
  const [error, setError] = useState<string | null>(null);
  const [read, setRead] = useState(isRead(item));
  // Resynchronisation si le serveur renvoie une autre valeur (autre onglet…).
  const [serverRead, setServerRead] = useState(read);
  if (isRead(item) !== serverRead) {
    setServerRead(isRead(item));
    setRead(isRead(item));
  }
  const [isPending, startTransition] = useTransition();

  const saveUrl = () => {
    const parsed = urlSchema.safeParse(url);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "URL invalide");
      return;
    }
    setError(null);
    const next = parsed.data;
    if (next === savedUrl) {
      setUrl(next ?? "");
      return;
    }
    startTransition(async () => {
      const result = await updateItem(item.id, { url: next });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setSavedUrl(next);
      setUrl(next ?? "");
      toast({ title: next ? "URL enregistrée" : "URL retirée" });
    });
  };

  const toggleRead = () => {
    const next = !read;
    setRead(next);
    startTransition(async () => {
      const result = await setLinkRead(item.id, next);
      if (result.ok) {
        toast({ title: next ? "Marqué comme lu" : "Remis à lire" });
      } else {
        setRead(!next);
        toast({ title: result.error, variant: "danger" });
      }
    });
  };

  const inputId = `url-${item.id}`;

  return (
    <section aria-label="Lien" className="flex flex-col gap-2">
      <label htmlFor={inputId} className="text-sm font-medium text-neutral-12">
        URL
      </label>
      <Input
        id={inputId}
        type="url"
        inputMode="url"
        value={url}
        onChange={(event) => {
          setUrl(event.target.value);
          if (error) setError(null);
        }}
        onBlur={saveUrl}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.preventDefault();
            saveUrl();
          }
        }}
        placeholder="https://…"
        maxLength={2048}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${inputId}-error` : undefined}
      />
      {error && (
        <p id={`${inputId}-error`} role="alert" className="text-xs text-danger-11">
          {error}
        </p>
      )}

      <div className="flex flex-wrap gap-2">
        {savedUrl ? (
          <Button asChild size="sm">
            <a href={savedUrl} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="size-4" />
              Ouvrir le site
            </a>
          </Button>
        ) : (
          <Button size="sm" disabled>
            <ExternalLink className="size-4" />
            Ouvrir le site
          </Button>
        )}
        <Button variant="outline" size="sm" aria-pressed={read} onClick={toggleRead} disabled={isPending}>
          {read ? <Undo2 className="size-4" /> : <Check className="size-4" />}
          {read ? "Remettre à lire" : "Marquer comme lu"}
        </Button>
        <span className="self-center text-xs text-neutral-11">{read ? "Lu" : "À lire"}</span>
      </div>
    </section>
  );
}
