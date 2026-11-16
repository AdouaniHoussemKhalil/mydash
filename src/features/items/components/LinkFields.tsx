"use client";

import { Check, ExternalLink, RefreshCw, Undo2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { Button } from "@/components/ui/core";
import { Input } from "@/components/ui/forms";
import { toast } from "@/components/ui/overlays";
import { RemoteImage } from "@/components/RemoteImage";
import { displayHost } from "@/lib/url";
import { setLinkRead, updateItem } from "../actions";
import { type Item, isRead, urlSchema } from "../schemas";

export type LinkFieldsProps = {
  item: Pick<Item, "id" | "url" | "link_meta">;
  /** Titre de la page récupéré par l'aperçu (remplace le titre généré). */
  onPreviewTitle?: ((title: string) => void) | undefined;
};

type PreviewResponse = { error?: string | null; titleUpdated?: boolean; preview?: { pageTitle: string | null } };

/**
 * Champs propres à un lien dans le détail : URL (enregistrée à la sortie du
 * champ ou sur Entrée), aperçu de la page, ouverture du site, statut lu.
 */
export function LinkFields({ item, onPreviewTitle }: LinkFieldsProps) {
  const router = useRouter();
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
  const [refreshing, setRefreshing] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);

  const meta = item.link_meta;
  /** Lien jamais analysé (créé depuis la palette, la création rapide…). */
  const neverFetched = Boolean(item.url) && !meta?.fetched_at;

  const fetchPreview = useCallback(async () => {
    try {
      const response = await fetch(`/api/items/${item.id}/preview`, { method: "POST" });
      const body = (await response.json().catch(() => ({}))) as PreviewResponse;
      setPreviewError(body.error ?? (response.ok ? null : "Aperçu impossible"));
      if (body.titleUpdated && body.preview?.pageTitle) onPreviewTitle?.(body.preview.pageTitle);
    } catch {
      setPreviewError("Aperçu impossible : connexion interrompue");
    }
    router.refresh();
  }, [item.id, onPreviewTitle, router]);

  // Premier affichage d'un lien jamais analysé : récupérer l'aperçu une fois.
  const autoRequested = useRef(false);
  useEffect(() => {
    if (neverFetched && !autoRequested.current) {
      autoRequested.current = true;
      void fetchPreview();
    }
  }, [neverFetched, fetchPreview]);

  const refreshPreview = () => {
    setRefreshing(true);
    void fetchPreview().finally(() => setRefreshing(false));
  };

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
      if (next) await fetchPreview();
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
  const loadingPreview = refreshing || (neverFetched && !previewError);
  const shownError = previewError ?? meta?.fetch_error ?? null;
  const hasPreview = Boolean(
    item.url && meta?.fetched_at && !meta.fetch_error && (meta.image_url || meta.description || meta.site_name),
  );

  return (
    <section aria-label="Lien" className="flex flex-col gap-3">
      {hasPreview && meta && (
        <figure className="overflow-hidden rounded-lg border border-neutral-6 bg-neutral-2">
          {meta.image_url && <RemoteImage src={meta.image_url} className="max-h-48 w-full object-cover" />}
          <figcaption className="flex flex-col gap-1 p-3">
            <span className="flex items-center gap-2 text-xs text-neutral-11">
              {meta.favicon_url && <RemoteImage src={meta.favicon_url} className="size-4 rounded-sm" />}
              {meta.site_name ?? (item.url ? displayHost(item.url) : null)}
            </span>
            {meta.page_title && <span className="text-sm font-medium text-neutral-12">{meta.page_title}</span>}
            {meta.description && <span className="line-clamp-3 text-sm text-neutral-11">{meta.description}</span>}
          </figcaption>
        </figure>
      )}

      <div className="flex flex-col gap-2">
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
        <p role="status" aria-live="polite" className="text-xs text-neutral-11">
          {loadingPreview
            ? "Récupération de l'aperçu…"
            : shownError && item.url
              ? `Aperçu indisponible : ${shownError}`
              : ""}
        </p>
      </div>

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
        {savedUrl && (
          <Button variant="ghost" size="sm" onClick={refreshPreview} disabled={loadingPreview || isPending}>
            <RefreshCw className="size-4" />
            Actualiser l&apos;aperçu
          </Button>
        )}
        <span className="self-center text-xs text-neutral-11">{read ? "Lu" : "À lire"}</span>
      </div>
    </section>
  );
}
