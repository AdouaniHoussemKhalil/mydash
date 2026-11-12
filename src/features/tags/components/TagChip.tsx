import { X } from "lucide-react";
import type { ReactNode } from "react";
import { ColorDot } from "@/components/ColorDot";
import { cn } from "@quickadui/utils";
import type { Tag } from "../schemas";

export type TagChipProps = {
  tag: Pick<Tag, "name" | "color">;
  onRemove?: (() => void) | undefined;
  active?: boolean | undefined;
  className?: string | undefined;
  children?: ReactNode;
};

export function TagChip({ tag, onRemove, active, className }: TagChipProps) {
  return (
    <span
      className={cn(
        "inline-flex max-w-full items-center gap-1.5 rounded-full border border-neutral-6 bg-neutral-2 py-0.5 pr-1 pl-2 text-xs text-neutral-12",
        !onRemove && "pr-2",
        active && "border-accent-8 bg-accent-3",
        className,
      )}
    >
      <ColorDot color={tag.color} className="size-2" />
      <span className="truncate">{tag.name}</span>
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          aria-label={`Retirer le tag ${tag.name}`}
          className="rounded-full p-0.5 text-neutral-11 hover:bg-neutral-4 hover:text-neutral-12"
        >
          <X className="size-3" />
        </button>
      )}
    </span>
  );
}
