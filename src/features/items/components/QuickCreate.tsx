"use client";

import { Plus } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { type FormEvent, useRef, useState, useTransition } from "react";
import { Button } from "@/components/ui/core";
import { Input } from "@/components/ui/forms";
import { withSearchParams } from "@/features/shell";
import { createItem } from "../actions";
import type { Item } from "../schemas";

export type QuickCreateProps = {
  type: Item["type"];
  /** Libellé au singulier : « note », « lien »… */
  itemLabel: string;
};

/** Création en une ligne : titre + Entrée, puis ouverture du détail. */
export function QuickCreate({ type, itemLabel }: QuickCreateProps) {
  const router = useRouter();
  const pathname = usePathname();
  const inputRef = useRef<HTMLInputElement>(null);
  const [title, setTitle] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!title.trim()) return;
    setError(null);
    startTransition(async () => {
      const result = await createItem({ type, title });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setTitle("");
      router.replace(`${pathname}${withSearchParams(window.location.search, { item: result.data.id })}`, {
        scroll: false,
      });
      inputRef.current?.focus();
    });
  };

  const label = `Ajouter : ${itemLabel.toLowerCase()}`;

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-1">
      <div className="flex gap-2">
        <Input
          ref={inputRef}
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder={`${itemLabel} : un titre suffit, puis Entrée`}
          aria-label={label}
          aria-invalid={error ? true : undefined}
          maxLength={500}
          startIcon={<Plus className="size-4" />}
          disabled={isPending}
        />
        <Button type="submit" disabled={isPending || !title.trim()}>
          Ajouter
        </Button>
      </div>
      {error && (
        <p role="alert" className="text-sm text-danger-11">
          {error}
        </p>
      )}
    </form>
  );
}
