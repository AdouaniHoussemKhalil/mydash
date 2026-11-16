"use client";

import { useEffect, useState } from "react";
import { CopyButton } from "@/components/ui/core";
import { HASH_ALGORITHMS, type HashAlgorithm, hashText } from "../lib/hash";
import { ToolInput } from "./ToolFields";

type Hashes = { input: string; values: Record<HashAlgorithm, string> };

/** SHA-1, SHA-256 et SHA-512 d'un texte (UTF-8), calculés par le navigateur. */
export function HashTool() {
  const [input, setInput] = useState("");
  const [hashes, setHashes] = useState<Hashes | null>(null);

  useEffect(() => {
    if (!input) return;
    let cancelled = false;
    void Promise.all(HASH_ALGORITHMS.map((algorithm) => hashText(input, algorithm))).then((values) => {
      if (!cancelled) {
        setHashes({ input, values: Object.fromEntries(HASH_ALGORITHMS.map((algorithm, index) => [algorithm, values[index]!])) as Hashes["values"] });
      }
    });
    return () => {
      cancelled = true;
    };
  }, [input]);

  // N'afficher que les empreintes du texte actuel (calcul asynchrone).
  const current = input && hashes?.input === input ? hashes.values : null;

  return (
    <div className="flex flex-col gap-4">
      <ToolInput label="Texte" value={input} onChange={setInput} placeholder="Texte à hacher (encodé en UTF-8)" rows={6} />
      {current && (
        <dl className="flex flex-col divide-y divide-neutral-6 rounded-lg border border-neutral-6" aria-label="Empreintes">
          {HASH_ALGORITHMS.map((algorithm) => (
            <div key={algorithm} className="flex flex-wrap items-center gap-x-4 gap-y-1 px-4 py-2">
              <dt className="w-20 shrink-0 text-sm text-neutral-11">{algorithm}</dt>
              <dd className="min-w-0 flex-1 font-mono text-xs break-all text-neutral-12">{current[algorithm]}</dd>
              <CopyButton value={current[algorithm]} size="sm" variant="ghost" />
            </div>
          ))}
        </dl>
      )}
      <p className="text-xs text-neutral-11">
        Pour vérifier l&apos;intégrité d&apos;un texte. Ne sert pas à stocker des mots de passe (utilise bcrypt ou Argon2 côté serveur).
      </p>
    </div>
  );
}
