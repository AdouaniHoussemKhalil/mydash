"use client";

import { RefreshCw } from "lucide-react";
import { useId, useState } from "react";
import { Button, Tabs, TabsList, TabsTrigger } from "@/components/ui/core";
import { Input } from "@/components/ui/forms";
import { generateUuids, type UuidVersion } from "../lib/uuid";
import { ToolOutput } from "./ToolFields";

const VERSION_HINTS: Record<UuidVersion, string> = {
  v4: "Aléatoire : le plus courant.",
  v7: "Horodaté : se trie dans l'ordre de création (idéal comme clé en base).",
};

/** UUID v4 / v7, 1 à 100 à la fois. */
export function UuidTool() {
  const [version, setVersion] = useState<UuidVersion>("v4");
  const [count, setCount] = useState("1");
  const [uuids, setUuids] = useState<string[]>([]);
  const countId = useId();

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end gap-4">
        <div className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-neutral-12">Version</span>
          <Tabs value={version} onValueChange={(value) => setVersion(value as UuidVersion)}>
            <TabsList aria-label="Version">
              <TabsTrigger value="v4">v4</TabsTrigger>
              <TabsTrigger value="v7">v7</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor={countId} className="text-sm font-medium text-neutral-12">
            Nombre
          </label>
          <Input id={countId} type="number" min={1} max={100} value={count} onChange={(event) => setCount(event.target.value)} className="w-24" />
        </div>
        <Button type="button" onClick={() => setUuids(generateUuids(version, Number(count)))}>
          <RefreshCw className="size-4" />
          Générer
        </Button>
      </div>
      <p className="text-sm text-neutral-11">{VERSION_HINTS[version]}</p>
      <ToolOutput label={uuids.length > 1 ? `${uuids.length} UUID` : "UUID"} value={uuids.join("\n")} rows={Math.min(12, Math.max(3, uuids.length))} />
    </div>
  );
}
