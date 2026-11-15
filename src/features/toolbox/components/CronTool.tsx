"use client";

import { CalendarClock } from "lucide-react";
import { useId, useState } from "react";
import { Input } from "@/components/ui/forms";
import { describeCron, nextRuns, parseCron } from "../lib/cron";

const EXAMPLES = [
  { expression: "0 9 * * 1-5", label: "En semaine à 9 h" },
  { expression: "*/15 * * * *", label: "Toutes les 15 min" },
  { expression: "0 2 * * 0", label: "Le dimanche à 2 h" },
  { expression: "0 0 1 * *", label: "Le 1er du mois" },
  { expression: "30 18 * * 5", label: "Vendredi 18 h 30" },
  { expression: "@daily", label: "Chaque nuit à minuit" },
];

const LEGEND = ["minute", "heure", "jour", "mois", "jour sem."];

const runFormat = new Intl.DateTimeFormat("fr", { weekday: "long", day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" });

/** Traduit une expression cron en français et liste ses 5 prochaines exécutions. */
export function CronTool() {
  const [input, setInput] = useState("");
  const inputId = useId();
  // Calculé à la saisie (jamais au rendu serveur) : dépend de « maintenant ».
  const result = input.trim() ? parseCron(input) : null;
  const runs = result?.ok ? nextRuns(result.cron, 5) : [];

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-1.5">
        <label htmlFor={inputId} className="text-sm font-medium text-neutral-12">
          Expression cron
        </label>
        <Input
          id={inputId}
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder="0 9 * * 1"
          spellCheck={false}
          autoComplete="off"
          className="font-mono text-base"
        />
        <p aria-hidden className="flex gap-4 px-3 font-mono text-xs text-neutral-11">
          {LEGEND.map((field) => (
            <span key={field}>{field}</span>
          ))}
        </p>
      </div>

      <div className="flex flex-wrap gap-2" aria-label="Exemples">
        {EXAMPLES.map((example) => (
          <button
            key={example.expression}
            type="button"
            onClick={() => setInput(example.expression)}
            className="rounded-full border border-neutral-6 px-3 py-1 text-xs text-neutral-11 transition-colors hover:border-neutral-8 hover:text-neutral-12 focus-visible:outline-2 focus-visible:outline-accent-8"
          >
            <code className="mr-1.5 font-mono text-neutral-12">{example.expression}</code>
            {example.label}
          </button>
        ))}
      </div>

      {result && !result.ok && (
        <p role="alert" className="rounded-md border border-danger-7 bg-danger-2 px-3 py-2 text-sm text-danger-11">
          {result.error}
        </p>
      )}

      {result?.ok && (
        <>
          <p role="status" className="rounded-lg border border-accent-7 bg-accent-2 px-4 py-3 text-lg font-medium text-accent-12">
            {describeCron(result.cron)}
          </p>
          <section className="flex flex-col gap-2">
            <h2 className="flex items-center gap-1.5 text-sm font-medium text-neutral-12">
              <CalendarClock className="size-4" aria-hidden />
              Prochaines exécutions (heure locale)
            </h2>
            {runs.length === 0 ? (
              <p className="text-sm text-neutral-11">Aucune exécution dans les 8 prochaines années (date impossible ?).</p>
            ) : (
              <ol className="flex flex-col divide-y divide-neutral-6 rounded-lg border border-neutral-6" aria-label="Prochaines exécutions">
                {runs.map((run) => (
                  <li key={run.getTime()} className="px-4 py-2 text-sm text-neutral-12">
                    <time dateTime={run.toISOString()}>{runFormat.format(run)}</time>
                  </li>
                ))}
              </ol>
            )}
          </section>
        </>
      )}
    </div>
  );
}
