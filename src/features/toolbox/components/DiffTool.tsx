"use client";

import { useId, useMemo, useState } from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/core";
import { Checkbox } from "@/components/ui/forms";
import { cn } from "@quickadui/utils";
import { DIFF_MAX_LINES, diffLines, toSideBySide } from "../lib/diff";
import { ToolInput } from "./ToolFields";

type View = "side" | "unified";

const lineCount = (text: string) => (text ? text.split("\n").length : 0);

/** Compare deux textes ligne à ligne. */
export function DiffTool() {
  const [left, setLeft] = useState("");
  const [right, setRight] = useState("");
  const [view, setView] = useState<View>("side");
  const [ignoreSpaces, setIgnoreSpaces] = useState(false);
  const ignoreId = useId();

  const tooLong = lineCount(left) > DIFF_MAX_LINES || lineCount(right) > DIFF_MAX_LINES;
  const result = useMemo(
    () => (tooLong || (!left && !right) ? null : diffLines(left, right, ignoreSpaces)),
    [left, right, ignoreSpaces, tooLong],
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ToolInput label="Texte d'origine" value={left} onChange={setLeft} placeholder="Version A" rows={10} />
        <ToolInput label="Texte modifié" value={right} onChange={setRight} placeholder="Version B" rows={10} />
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <Tabs value={view} onValueChange={(value) => setView(value as View)}>
          <TabsList aria-label="Affichage">
            <TabsTrigger value="side">Côte à côte</TabsTrigger>
            <TabsTrigger value="unified">À la suite</TabsTrigger>
          </TabsList>
        </Tabs>
        <label htmlFor={ignoreId} className="flex items-center gap-2 text-sm text-neutral-12">
          <Checkbox id={ignoreId} checked={ignoreSpaces} onCheckedChange={(checked) => setIgnoreSpaces(checked === true)} />
          Ignorer les espaces en fin de ligne
        </label>
        {result && (
          <p role="status" className="text-sm text-neutral-11">
            {result.identical ? (
              "Textes identiques"
            ) : (
              <>
                <span className="font-medium text-success-11">+{result.added}</span>{" "}
                <span className="font-medium text-danger-11">−{result.removed}</span> lignes
              </>
            )}
          </p>
        )}
      </div>

      {tooLong && (
        <p role="alert" className="rounded-md border border-danger-7 bg-danger-2 px-3 py-2 text-sm text-danger-11">
          Textes trop longs : {DIFF_MAX_LINES.toLocaleString("fr-FR")} lignes maximum de chaque côté.
        </p>
      )}

      {result && !result.identical && (
        <div className="overflow-x-auto rounded-lg border border-neutral-6 font-mono text-xs">
          {view === "unified" ? (
            <table className="w-full border-collapse" aria-label="Différences">
              <tbody>
                {result.lines.map((line, index) => (
                  <tr
                    key={index}
                    className={cn(line.type === "added" && "bg-success-3", line.type === "removed" && "bg-danger-3")}
                  >
                    <td className="w-10 px-2 text-right text-neutral-11 select-none">{line.type === "added" ? "" : line.left}</td>
                    <td className="w-10 px-2 text-right text-neutral-11 select-none">{line.type === "removed" ? "" : line.right}</td>
                    <td className="w-5 text-center text-neutral-11 select-none">
                      {line.type === "added" ? "+" : line.type === "removed" ? "−" : ""}
                    </td>
                    <td className="px-2 py-0.5 whitespace-pre text-neutral-12">{line.text || " "}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <table className="w-full table-fixed border-collapse" aria-label="Différences">
              <tbody>
                {toSideBySide(result.lines).map((row, index) => (
                  <tr key={index}>
                    <td className="w-10 px-2 text-right align-top text-neutral-11 select-none">{row.left?.number ?? ""}</td>
                    <td className={cn("border-r border-neutral-6 px-2 py-0.5 break-all whitespace-pre-wrap text-neutral-12", row.left?.changed && "bg-danger-3")}>
                      {row.left ? row.left.text || " " : ""}
                    </td>
                    <td className="w-10 px-2 text-right align-top text-neutral-11 select-none">{row.right?.number ?? ""}</td>
                    <td className={cn("px-2 py-0.5 break-all whitespace-pre-wrap text-neutral-12", row.right?.changed && "bg-success-3")}>
                      {row.right ? row.right.text || " " : ""}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
