"use client";

import { useId, useState } from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/core";
import { Checkbox } from "@/components/ui/forms";
import { decodeUrl, encodeUrl } from "../lib/url";
import { ToolInput, ToolOutput } from "./ToolFields";

type Mode = "encode" | "decode";

/** Encodage d'URL (percent-encoding), en direct. */
export function UrlTool() {
  const [mode, setMode] = useState<Mode>("encode");
  const [input, setInput] = useState("");
  const [plusAsSpace, setPlusAsSpace] = useState(true);
  const plusId = useId();

  const decoded = mode === "decode" && input ? decodeUrl(input, plusAsSpace) : null;
  const output = mode === "encode" ? encodeUrl(input) : decoded?.ok ? decoded.output : "";
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
        {mode === "decode" && (
          <label htmlFor={plusId} className="flex items-center gap-2 text-sm text-neutral-12">
            <Checkbox id={plusId} checked={plusAsSpace} onCheckedChange={(checked) => setPlusAsSpace(checked === true)} />
            « + » = espace (formulaires)
          </label>
        )}
      </div>
      <ToolInput
        label={mode === "encode" ? "Texte" : "Texte encodé"}
        value={input}
        onChange={setInput}
        placeholder={mode === "encode" ? "ville=Tunis & pays=Tunisie" : "ville%3DTunis%20%26%20pays%3DTunisie"}
        rows={6}
      />
      <ToolOutput label={mode === "encode" ? "Texte encodé" : "Texte"} value={output} error={error} rows={6} />
    </div>
  );
}
