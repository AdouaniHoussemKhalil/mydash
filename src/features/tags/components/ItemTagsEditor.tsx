"use client";

import { Tag as TagIcon } from "lucide-react";
import { type FormEvent, useId, useState, useTransition } from "react";
import { Input } from "@/components/ui/forms";
import { toast } from "@/components/ui/overlays";
import { attachTag, detachTag } from "../actions";
import type { Tag } from "../schemas";
import { TagChip } from "./TagChip";

export type ItemTagsEditorProps = {
  itemId: string;
  tags: Tag[];
  /** Tous les tags du workspace, pour l'autocomplétion. */
  allTags: Tag[];
};

/** Tags d'un item : taper un nom + Entrée l'ajoute (créé s'il n'existe pas). */
export function ItemTagsEditor({ itemId, tags: initialTags, allTags }: ItemTagsEditorProps) {
  const listId = useId();
  const [tags, setTags] = useState(initialTags);
  const [value, setValue] = useState("");
  const [isPending, startTransition] = useTransition();

  const assigned = new Set(tags.map((tag) => tag.name.toLowerCase()));
  const suggestions = allTags.filter((tag) => !assigned.has(tag.name.toLowerCase()));

  const add = (event: FormEvent) => {
    event.preventDefault();
    const name = value.trim();
    if (!name) return;
    if (assigned.has(name.replace(/^#+/, "").toLowerCase())) {
      setValue("");
      return;
    }
    startTransition(async () => {
      const result = await attachTag(itemId, name);
      if (!result.ok) {
        toast({ title: result.error, variant: "danger" });
        return;
      }
      setTags((current) => [...current, result.data].sort((a, b) => a.name.localeCompare(b.name, "fr")));
      setValue("");
    });
  };

  const remove = (tag: Tag) => {
    const previous = tags;
    setTags(tags.filter((t) => t.id !== tag.id));
    startTransition(async () => {
      const result = await detachTag(itemId, tag.id);
      if (!result.ok) {
        setTags(previous);
        toast({ title: result.error, variant: "danger" });
      }
    });
  };

  return (
    <section aria-label="Tags" className="flex flex-col gap-2">
      <h4 className="flex items-center gap-1.5 text-xs font-medium text-neutral-11">
        <TagIcon className="size-3.5" aria-hidden /> Tags
      </h4>
      {tags.length > 0 && (
        <ul className="flex flex-wrap gap-1.5">
          {tags.map((tag) => (
            <li key={tag.id}>
              <TagChip tag={tag} onRemove={() => remove(tag)} />
            </li>
          ))}
        </ul>
      )}
      <form onSubmit={add}>
        <Input
          inputSize="sm"
          value={value}
          onChange={(event) => setValue(event.target.value)}
          list={listId}
          placeholder="Ajouter un tag + Entrée"
          aria-label="Ajouter un tag"
          maxLength={50}
          disabled={isPending}
        />
        <datalist id={listId}>
          {suggestions.map((tag) => (
            <option key={tag.id} value={tag.name} />
          ))}
        </datalist>
      </form>
    </section>
  );
}
