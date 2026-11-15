"use client";

import { useId } from "react";
import { CopyButton } from "@/components/ui/core";
import { Textarea } from "@/components/ui/forms";
import { cn } from "@quickadui/utils";

export type ToolInputProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
};

/** Zone de saisie d'un outil (police à chasse fixe, sans correcteur). */
export function ToolInput({ label, value, onChange, placeholder, rows = 10 }: ToolInputProps) {
  const id = useId();
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium text-neutral-12">
        {label}
      </label>
      <Textarea
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        rows={rows}
        spellCheck={false}
        autoComplete="off"
        className="font-mono text-sm"
      />
    </div>
  );
}

export type ToolOutputProps = {
  label: string;
  value: string;
  /** Message d'erreur affiché à la place du résultat. */
  error?: string | null | undefined;
  rows?: number;
};

/** Résultat d'un outil : lecture seule, bouton « Copier », ou erreur. */
export function ToolOutput({ label, value, error, rows = 10 }: ToolOutputProps) {
  const id = useId();
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between gap-2">
        <label htmlFor={id} className="text-sm font-medium text-neutral-12">
          {label}
        </label>
        {value && !error && <CopyButton value={value} size="sm" variant="ghost" />}
      </div>
      {error ? (
        <p role="alert" className="rounded-md border border-danger-7 bg-danger-2 px-3 py-2 text-sm text-danger-11">
          {error}
        </p>
      ) : (
        <textarea
          id={id}
          value={value}
          readOnly
          rows={rows}
          spellCheck={false}
          className={cn(
            "w-full rounded-md border border-neutral-6 bg-neutral-1 px-3 py-2 font-mono text-sm text-neutral-12 outline-none",
            "focus-visible:border-accent-8 focus-visible:ring-2 focus-visible:ring-accent-8/30",
          )}
          placeholder="Le résultat s'affiche ici."
        />
      )}
    </div>
  );
}
