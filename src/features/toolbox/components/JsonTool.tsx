"use client";

import { useState } from "react";
import { Button } from "@/components/ui/core";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/forms";
import { formatJson, type JsonResult } from "../lib/json";
import { ToolInput, ToolOutput } from "./ToolFields";

const INDENTS = { "2": 2, "4": 4, tab: "\t" } as const;
type IndentKey = keyof typeof INDENTS;

/** JSON : formater (indentation au choix), minifier, valider. */
export function JsonTool() {
  const [input, setInput] = useState("");
  const [indent, setIndent] = useState<IndentKey>("2");
  const [result, setResult] = useState<JsonResult | null>(null);

  const run = (minify: boolean) => setResult(formatJson(input, minify ? 0 : INDENTS[indent]));

  const error =
    result && !result.ok
      ? result.line !== null
        ? `Ligne ${result.line}, colonne ${result.column} : ${result.error}`
        : result.error
      : null;

  return (
    <div className="flex flex-col gap-4">
      <ToolInput
        label="JSON à traiter"
        value={input}
        onChange={(value) => {
          setInput(value);
          setResult(null);
        }}
        placeholder='{"nom": "MyDash", "version": 1}'
        rows={12}
      />
      <div className="flex flex-wrap items-center gap-2">
        <Button type="button" onClick={() => run(false)}>
          Formater
        </Button>
        <Select value={indent} onValueChange={(value) => setIndent(value as IndentKey)}>
          <SelectTrigger aria-label="Indentation" className="w-36">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="2">2 espaces</SelectItem>
            <SelectItem value="4">4 espaces</SelectItem>
            <SelectItem value="tab">Tabulation</SelectItem>
          </SelectContent>
        </Select>
        <Button type="button" variant="outline" onClick={() => run(true)}>
          Minifier
        </Button>
        {result?.ok && <span className="text-sm text-success-11">JSON valide</span>}
      </div>
      <ToolOutput label="Résultat" value={result?.ok ? result.output : ""} error={error} rows={12} />
    </div>
  );
}
