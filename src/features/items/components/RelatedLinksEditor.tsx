"use client";

import { ExternalLink, Link2, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { type FormEvent, useId, useState, useTransition } from "react";
import { Button, IconButton } from "@/components/ui/core";
import { Input } from "@/components/ui/forms";
import { toast } from "@/components/ui/overlays";
import { RemoteImage } from "@/components/RemoteImage";
import { displayHost } from "@/lib/url";
import { attachLink, detachLink } from "../actions";
import type { RelatedLink } from "../queries";

export type RelatedLinksEditorProps = {
  itemId: string;
  links: RelatedLink[];
};

/**
 * Liens attachés à un élément : coller une URL crée (ou réutilise) un vrai
 * lien, visible aussi dans le module Liens. Retirer ne supprime pas le lien.
 */
export function RelatedLinksEditor({ itemId, links }: RelatedLinksEditorProps) {
  const router = useRouter();
  const [url, setUrl] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const headingId = useId();
  const inputId = useId();

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!url.trim()) return;
    setError(null);
    startTransition(async () => {
      const result = await attachLink(itemId, url);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setUrl("");
      toast({ title: "Lien attaché" });
      // Nouveau lien : récupérer son aperçu (titre, favicon) sans bloquer.
      if (result.data.created) {
        void fetch(`/api/items/${result.data.id}/preview`, { method: "POST" }).then(() => router.refresh());
      }
    });
  };

  const remove = (link: RelatedLink) => {
    startTransition(async () => {
      const result = await detachLink(itemId, link.id);
      toast(result.ok ? { title: "Lien retiré" } : { title: result.error, variant: "danger" });
    });
  };

  return (
    <section aria-labelledby={headingId} className="flex flex-col gap-2">
      <h3 id={headingId} className="flex items-center gap-1.5 text-sm font-medium text-neutral-12">
        <Link2 className="size-4" aria-hidden />
        Liens
      </h3>

      {/* noValidate : « exemple.com » sans https:// est accepté (validation serveur). */}
      <form onSubmit={onSubmit} className="flex flex-col gap-1" noValidate>
        <label htmlFor={inputId} className="sr-only">
          Attacher un lien
        </label>
        <div className="flex gap-2">
          <Input
            id={inputId}
            type="url"
            inputMode="url"
            value={url}
            onChange={(event) => {
              setUrl(event.target.value);
              if (error) setError(null);
            }}
            placeholder="Colle une URL, puis Entrée"
            maxLength={2048}
            aria-invalid={error ? true : undefined}
            disabled={isPending}
          />
          <Button type="submit" variant="outline" disabled={isPending || !url.trim()}>
            Attacher
          </Button>
        </div>
        {error && (
          <p role="alert" className="text-xs text-danger-11">
            {error}
          </p>
        )}
      </form>

      {links.length === 0 ? (
        <p className="text-sm text-neutral-11">Aucun lien attaché.</p>
      ) : (
        <ul className="flex flex-col divide-y divide-neutral-6 rounded-lg border border-neutral-6" aria-label="Liens attachés">
          {links.map((link) => {
            const host = link.url ? displayHost(link.url) : null;
            return (
              <li key={link.id} className="flex items-center gap-2 px-3 py-2">
                {link.faviconUrl && <RemoteImage src={link.faviconUrl} className="size-4 shrink-0 rounded-sm" />}
                <div className="min-w-0 flex-1">
                  <Link href={`/links?item=${link.id}`} className="block truncate text-sm text-neutral-12 hover:underline">
                    {link.title}
                  </Link>
                  {(link.siteName ?? host) && <p className="truncate text-xs text-neutral-11">{link.siteName ?? host}</p>}
                </div>
                {link.url && (
                  <IconButton asChild variant="ghost" size="sm" aria-label={`Ouvrir ${host ?? "le site"} dans un nouvel onglet`}>
                    <a href={link.url} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="size-4" />
                    </a>
                  </IconButton>
                )}
                <IconButton variant="ghost" size="sm" aria-label={`Retirer le lien ${link.title}`} onClick={() => remove(link)} disabled={isPending}>
                  <X className="size-4" />
                </IconButton>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
