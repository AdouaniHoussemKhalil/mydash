import Link from "next/link";
import type { Tag } from "../schemas";
import { TagChip } from "./TagChip";

export type TagFilterProps = {
  tags: Tag[];
  activeTagId: string | undefined;
  /** Construit l'URL pour un tag (null = retirer le filtre). */
  hrefFor: (tagId: string | null) => string;
};

/** Filtre par tag : un clic active, un second clic retire. */
export function TagFilter({ tags, activeTagId, hrefFor }: TagFilterProps) {
  if (tags.length === 0) return null;
  return (
    <nav aria-label="Filtrer par tag" className="flex flex-wrap items-center gap-1.5">
      <span className="text-xs text-neutral-11">Filtrer :</span>
      {tags.map((tag) => {
        const active = tag.id === activeTagId;
        return (
          <Link
            key={tag.id}
            href={hrefFor(active ? null : tag.id)}
            scroll={false}
            aria-pressed={active}
            className="rounded-full focus-visible:outline-2 focus-visible:outline-accent-8"
          >
            <TagChip tag={tag} active={active} className="hover:border-neutral-8" />
          </Link>
        );
      })}
    </nav>
  );
}
