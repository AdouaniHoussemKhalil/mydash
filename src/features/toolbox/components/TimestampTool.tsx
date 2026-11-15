"use client";

import { Clock } from "lucide-react";
import { useId, useState } from "react";
import { Button, CopyButton } from "@/components/ui/core";
import { Input } from "@/components/ui/forms";
import { formatLocal, formatUtc, parseTimestamp } from "../lib/timestamp";

const UNIT_LABELS = { seconds: "secondes", milliseconds: "millisecondes", date: "date" } as const;

/** Timestamp Unix (s / ms) ↔ date, en heure locale et en UTC. */
export function TimestampTool() {
  const [input, setInput] = useState("");
  const inputId = useId();
  const result = input.trim() ? parseTimestamp(input) : null;

  const rows = result?.ok
    ? [
        { label: "Heure locale", value: formatLocal(result.date) },
        { label: "UTC", value: formatUtc(result.date) },
        { label: "ISO 8601", value: result.date.toISOString() },
        { label: "Secondes", value: String(result.seconds) },
        { label: "Millisecondes", value: String(result.milliseconds) },
      ]
    : [];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label htmlFor={inputId} className="text-sm font-medium text-neutral-12">
          Timestamp ou date
        </label>
        <div className="flex gap-2">
          <Input
            id={inputId}
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder="1794700000, 1794700000000 ou 2026-11-15T10:30:00Z"
            className="font-mono"
            spellCheck={false}
          />
          <Button type="button" variant="outline" onClick={() => setInput(String(Math.floor(Date.now() / 1000)))}>
            <Clock className="size-4" />
            Maintenant
          </Button>
        </div>
        {result?.ok && <p className="text-xs text-neutral-11">Lu comme : {UNIT_LABELS[result.unit]}</p>}
      </div>

      {result && !result.ok && (
        <p role="alert" className="rounded-md border border-danger-7 bg-danger-2 px-3 py-2 text-sm text-danger-11">
          {result.error}
        </p>
      )}

      {rows.length > 0 && (
        <dl className="flex flex-col divide-y divide-neutral-6 rounded-lg border border-neutral-6">
          {rows.map((row) => (
            <div key={row.label} className="flex flex-wrap items-center gap-x-4 gap-y-1 px-4 py-2">
              <dt className="w-32 shrink-0 text-sm text-neutral-11">{row.label}</dt>
              <dd className="min-w-0 flex-1 font-mono text-sm break-all text-neutral-12">{row.value}</dd>
              <CopyButton value={row.value} size="sm" variant="ghost" />
            </div>
          ))}
        </dl>
      )}
    </div>
  );
}
