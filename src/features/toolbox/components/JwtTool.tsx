"use client";

import { ShieldAlert } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/core";
import { decodeJwt } from "../lib/jwt";
import { formatLocal } from "../lib/timestamp";
import { ToolInput, ToolOutput } from "./ToolFields";

const CLAIM_LABELS = { exp: "Expire le", iat: "Émis le", nbf: "Valable à partir du" } as const;

/** JWT : en-tête et contenu décodés, dates lisibles ; signature non vérifiée. */
export function JwtTool() {
  const [input, setInput] = useState("");
  // Calculé à la saisie (jamais au rendu serveur) : l'expiration dépend de « maintenant ».
  const result = input.trim() ? decodeJwt(input) : null;

  return (
    <div className="flex flex-col gap-4">
      <p className="flex items-start gap-2 rounded-md border border-warning-7 bg-warning-2 px-3 py-2 text-sm text-warning-11">
        <ShieldAlert className="mt-0.5 size-4 shrink-0" aria-hidden />
        Décodage seulement : la signature n&apos;est pas vérifiée. Le jeton reste dans ton navigateur et n&apos;est pas conservé.
      </p>
      <ToolInput label="JWT" value={input} onChange={setInput} placeholder="eyJhbGciOiJIUzI1NiIs… (« Bearer » accepté)" rows={5} />

      {result && !result.ok && <ToolOutput label="Contenu" value="" error={result.error} />}

      {result?.ok && (
        <>
          <div className="flex flex-wrap items-center gap-2" role="status">
            {result.expired === true && <Badge variant="danger">Expiré</Badge>}
            {result.expired === false && <Badge variant="success">Non expiré</Badge>}
            {result.expired === null && <Badge variant="outline">Sans expiration</Badge>}
            {result.notYetValid && <Badge variant="warning">Pas encore valable</Badge>}
            {!result.hasSignature && <Badge variant="warning">Sans signature</Badge>}
            {typeof result.header.alg === "string" && <Badge variant="soft">{result.header.alg}</Badge>}
          </div>

          {(result.dates.exp || result.dates.iat || result.dates.nbf) && (
            <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 rounded-lg border border-neutral-6 px-4 py-3 text-sm">
              {(Object.keys(CLAIM_LABELS) as (keyof typeof CLAIM_LABELS)[]).map((claim) => {
                const date = result.dates[claim];
                if (!date) return null;
                return (
                  <div key={claim} className="contents">
                    <dt className="text-neutral-11">
                      {CLAIM_LABELS[claim]} <code className="text-xs">({claim})</code>
                    </dt>
                    <dd className="text-neutral-12">
                      <time dateTime={date.toISOString()}>{formatLocal(date)}</time>
                    </dd>
                  </div>
                );
              })}
            </dl>
          )}

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <ToolOutput label="En-tête" value={JSON.stringify(result.header, null, 2)} rows={8} />
            <ToolOutput label="Contenu (payload)" value={JSON.stringify(result.payload, null, 2)} rows={8} />
          </div>
        </>
      )}
    </div>
  );
}
