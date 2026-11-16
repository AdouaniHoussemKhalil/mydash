"use client";

import { useId, useState } from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/core";
import { Checkbox } from "@/components/ui/forms";
import { decodeBase64, encodeBase64 } from "../lib/base64";
import { ToolInput, ToolOutput } from "./ToolFields";

type Mode = "encode" | "decode";

/** Base64 : encoder (UTF-8, variante URL) ou décoder, en direct. */
export function Base64Tool() {
  const [mode, setMode] = useState<Mode>("encode");
  const [input, setInput] = useState("");
  const [urlSafe, setUrlSafe] = useState(false);
  const urlSafeId = useId();

  const decoded = mode === "decode" && input ? decodeBase64(input) : null;
  const output = mode === "encode" ? (input ? encodeBase64(input, urlSafe) : "") : decoded?.ok ? decoded.output : "";
  const error = decoded && !decoded.ok ? decoded.error : null;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-4">
        <Tabs value={mode} onValueChange={(value) => setMode(value as Mode)}>
          <TabsList aria-label="Sens">
            <TabsTrigger value="encode">Encoder</TabsTrigger>
            <TabsTrigger value="decode">Décoder</TabsTrigger>
          </TabsList>
        </Tabs>
        {mode === "encode" && (
          <label htmlFor={urlSafeId} className="flex items-center gap-2 text-sm text-neutral-12">
            <Checkbox id={urlSafeId} checked={urlSafe} onCheckedChange={(checked) => setUrlSafe(checked === true)} />
            Variante URL (-_ sans « = »)
          </label>
        )}
      </div>
      <ToolInput
        label={mode === "encode" ? "Texte" : "Base64"}
        value={input}
        onChange={setInput}
        placeholder={mode === "encode" ? "Texte à encoder (accents compris)" : "SGVsbG8gTXlEYXNo"}
      />
      <ToolOutput label={mode === "encode" ? "Base64" : "Texte"} value={output} error={error} />
    </div>
  );
}
