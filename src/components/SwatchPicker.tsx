"use client";

import { Check } from "lucide-react";
import { SWATCHES } from "@/lib/colors";
import { cn } from "@quickadui/utils";

export type SwatchPickerProps = {
  value: string | null;
  onChange: (color: string | null) => void;
  label?: string | undefined;
};

export function SwatchPicker({ value, onChange, label = "Couleur" }: SwatchPickerProps) {
  return (
    <div role="radiogroup" aria-label={label} className="flex flex-wrap gap-1.5">
      <button
        type="button"
        role="radio"
        aria-checked={value === null}
        aria-label="Aucune couleur"
        onClick={() => onChange(null)}
        className={cn(
          "flex size-6 items-center justify-center rounded-full border border-dashed border-neutral-7 text-neutral-11",
          value === null && "ring-2 ring-accent-8 ring-offset-1 ring-offset-neutral-1",
        )}
      >
        {value === null && <Check className="size-3" />}
      </button>
      {SWATCHES.map((swatch) => (
        <button
          key={swatch}
          type="button"
          role="radio"
          aria-checked={value === swatch}
          aria-label={`Couleur ${swatch}`}
          onClick={() => onChange(swatch)}
          style={{ backgroundColor: swatch }}
          className={cn(
            "flex size-6 items-center justify-center rounded-full",
            value === swatch && "ring-2 ring-accent-8 ring-offset-1 ring-offset-neutral-1",
          )}
        >
          {value === swatch && <Check className="size-3 text-neutral-1" />}
        </button>
      ))}
    </div>
  );
}
