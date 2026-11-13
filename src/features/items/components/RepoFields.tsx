"use client";

import { ExternalLink } from "lucide-react";
import { useId, useState, useTransition } from "react";
import { Button } from "@/components/ui/core";
import { Input } from "@/components/ui/forms";
import { toast } from "@/components/ui/overlays";
import { parseRepo, REPO_PROVIDER_LABELS, repoFromHref, repoUrl } from "@/lib/repo";
import { parseUrl } from "@/lib/url";
import { updateItem } from "../actions";
import type { Item } from "../schemas";

/**
 * URL du dépôt d'un repo (GitHub ou GitLab), enregistrée à la sortie du
 * champ ou sur Entrée, et bouton pour l'ouvrir chez l'hébergeur.
 */
export function RepoFields({ item }: { item: Pick<Item, "id" | "url"> }) {
  const [url, setUrl] = useState(item.url ?? "");
  const [savedUrl, setSavedUrl] = useState(item.url);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const inputId = useId();

  const saved = savedUrl ? repoFromHref(savedUrl) : null;

  const save = () => {
    const value = url.trim();
    let next: string | null = null;
    if (value) {
      const parsed = parseUrl(value);
      const repo = parsed ? parseRepo(parsed) : null;
      if (!repo) {
        setError("Ce n'est pas l'URL d'un dépôt GitHub ou GitLab");
        return;
      }
      next = repoUrl(repo);
    }
    setError(null);
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
      toast({ title: next ? "URL du dépôt enregistrée" : "URL du dépôt retirée" });
    });
  };

  return (
    <section aria-label="Dépôt" className="flex flex-col gap-2">
      <label htmlFor={inputId} className="text-sm font-medium text-neutral-12">
        URL du dépôt
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
        onBlur={save}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.preventDefault();
            save();
          }
        }}
        placeholder="https://github.com/owner/repo"
        maxLength={2048}
        disabled={isPending}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${inputId}-error` : undefined}
      />
      {error && (
        <p id={`${inputId}-error`} role="alert" className="text-xs text-danger-11">
          {error}
        </p>
      )}
      <div>
        {saved && savedUrl ? (
          <Button asChild size="sm">
            <a href={savedUrl} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="size-4" />
              Ouvrir sur {REPO_PROVIDER_LABELS[saved.provider]}
            </a>
          </Button>
        ) : (
          <Button size="sm" disabled>
            <ExternalLink className="size-4" />
            Ouvrir le dépôt
          </Button>
        )}
      </div>
    </section>
  );
}
