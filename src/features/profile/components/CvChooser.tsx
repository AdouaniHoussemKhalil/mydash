"use client";

import { Check, FileText } from "lucide-react";
import { useRouter } from "next/navigation";
import { useId, useState, useTransition } from "react";
import { Button } from "@/components/ui/core";
import { cn } from "@quickadui/utils";
import { saveCvChoice } from "../actions";
import { CV_COLOR_PRESETS, CV_TEMPLATE_LABELS, CV_TEMPLATES, type CvTemplate } from "../schemas";
import { CvColorScope } from "./CvColorScope";

/** Miniature schématique d'un modèle (aux couleurs choisies). */
function TemplateThumbnail({ template }: { template: CvTemplate }) {
  if (template === "colonnes") {
    return (
      <div className="grid h-40 grid-cols-[38%_1fr] overflow-hidden rounded-md border border-neutral-6 bg-neutral-1">
        <div className="flex flex-col bg-neutral-12">
          <div className="flex flex-col items-center gap-1 bg-accent-9 px-2 py-3">
            <span className="size-8 rounded-full bg-neutral-12/70" />
            <span className="h-1.5 w-12 rounded bg-neutral-11" />
            <span className="h-1 w-10 rounded bg-neutral-11/70" />
          </div>
          <div className="flex flex-col gap-1.5 p-2">
            {[0, 1, 2].map((line) => (
              <span key={line} className="h-1 w-full rounded bg-neutral-6" />
            ))}
            <span className="mt-1 h-1 w-3/4 rounded bg-accent-9" />
          </div>
        </div>
        <div className="flex flex-col gap-1.5 p-2.5">
          <span className="h-1 w-full rounded bg-neutral-6" />
          <span className="h-1 w-5/6 rounded bg-neutral-6" />
          <div className="mt-1 grid grid-cols-2 gap-1.5">
            {[0, 1, 2, 3].map((bar) => (
              <span key={bar} className="h-1 rounded bg-accent-9" />
            ))}
          </div>
          <span className="mt-2 h-1.5 w-1/2 rounded bg-neutral-11" />
          {[0, 1].map((line) => (
            <span key={line} className="h-1 w-full rounded bg-neutral-6" />
          ))}
        </div>
      </div>
    );
  }
  return (
    <div className="flex h-40 flex-col gap-2 overflow-hidden rounded-md border border-neutral-6 bg-neutral-1 p-3">
      <div className="flex items-center gap-2">
        <span className="size-8 rounded-full bg-accent-4" />
        <div className="flex flex-col gap-1">
          <span className="h-2 w-20 rounded bg-neutral-12" />
          <span className="h-1.5 w-16 rounded bg-accent-9" />
        </div>
      </div>
      <div className="grid flex-1 grid-cols-[1fr_2fr] gap-3">
        <div className="flex flex-col gap-1.5">
          <span className="h-1 w-full rounded bg-accent-7" />
          {[0, 1, 2].map((line) => (
            <span key={line} className="h-1 w-3/4 rounded bg-accent-9" />
          ))}
        </div>
        <div className="flex flex-col gap-1.5">
          <span className="h-1 w-full rounded bg-accent-7" />
          {[0, 1, 2, 3].map((line) => (
            <span key={line} className="h-1 w-full rounded bg-neutral-6" />
          ))}
        </div>
      </div>
    </div>
  );
}

export type CvChooserProps = {
  initialTemplate: CvTemplate;
  initialColor: string | null;
};

/** Choix du modèle et de la couleur avant de générer le CV (retenus). */
export function CvChooser({ initialTemplate, initialColor }: CvChooserProps) {
  const router = useRouter();
  const [template, setTemplate] = useState<CvTemplate>(initialTemplate);
  const [color, setColor] = useState<string | null>(initialColor);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const templateLabel = useId();
  const colorLabel = useId();
  const customId = useId();
  const isPreset = color === null || CV_COLOR_PRESETS.some((preset) => preset.hex === color);

  const generate = () => {
    setError(null);
    startTransition(async () => {
      const result = await saveCvChoice({ template, color });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.push("/me/cv/apercu");
    });
  };

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-8">
      <section className="flex flex-col gap-3">
        <h2 id={templateLabel} className="text-base font-semibold text-neutral-12">
          1. Modèle
        </h2>
        <div role="radiogroup" aria-labelledby={templateLabel} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {CV_TEMPLATES.map((option) => {
            const selected = option === template;
            return (
              <button
                key={option}
                type="button"
                role="radio"
                aria-checked={selected}
                onClick={() => setTemplate(option)}
                className={cn(
                  "flex flex-col gap-3 rounded-lg border-2 bg-neutral-1 p-3 text-left transition-colors focus-visible:outline-2 focus-visible:outline-accent-8",
                  selected ? "border-accent-9" : "border-neutral-6 hover:border-neutral-8",
                )}
              >
                <CvColorScope color={color}>
                  <TemplateThumbnail template={option} />
                </CvColorScope>
                <span className="flex items-start gap-2">
                  <span
                    className={cn(
                      "mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border-2",
                      selected ? "border-accent-9 bg-accent-9 text-neutral-1" : "border-neutral-7",
                    )}
                  >
                    {selected && <Check className="size-3" />}
                  </span>
                  <span>
                    <span className="block font-semibold text-neutral-12">{CV_TEMPLATE_LABELS[option].name}</span>
                    <span className="block text-sm text-neutral-11">{CV_TEMPLATE_LABELS[option].description}</span>
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <h2 id={colorLabel} className="text-base font-semibold text-neutral-12">
          2. Couleur
        </h2>
        <div role="radiogroup" aria-labelledby={colorLabel} className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            role="radio"
            aria-checked={color === null}
            onClick={() => setColor(null)}
            className={cn(
              "rounded-full border-2 px-3 py-1 text-sm",
              color === null ? "border-accent-9 text-neutral-12" : "border-neutral-6 text-neutral-11 hover:border-neutral-8",
            )}
          >
            Couleur de l&apos;app
          </button>
          {CV_COLOR_PRESETS.map((preset) => {
            const selected = preset.hex === color;
            return (
              <button
                key={preset.hex}
                type="button"
                role="radio"
                aria-checked={selected}
                aria-label={preset.name}
                title={preset.name}
                onClick={() => setColor(preset.hex)}
                className={cn(
                  "flex size-9 items-center justify-center rounded-full border-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-8",
                  selected ? "border-neutral-12" : "border-transparent",
                )}
                // Teinte choisie par l'utilisateur : donnée, pas un style de l'app.
                style={{ backgroundColor: preset.hex }}
              >
                {selected && <Check className="size-4 text-neutral-1 drop-shadow" />}
              </button>
            );
          })}
          <label htmlFor={customId} className="ml-1 flex items-center gap-2 text-sm text-neutral-11">
            <input
              id={customId}
              type="color"
              value={color ?? "#4FC3E8"}
              onChange={(event) => setColor(event.target.value.toUpperCase())}
              className={cn("size-9 cursor-pointer rounded-full border-2 bg-transparent p-0.5", !isPreset ? "border-neutral-12" : "border-neutral-6")}
            />
            Couleur libre
          </label>
        </div>
      </section>

      {error && (
        <p role="alert" className="text-sm text-danger-11">
          {error}
        </p>
      )}
      <div className="flex justify-end">
        <Button type="button" size="lg" onClick={generate} disabled={isPending}>
          <FileText className="size-4" />
          {isPending ? "Génération…" : "Générer le CV"}
        </Button>
      </div>
    </div>
  );
}
