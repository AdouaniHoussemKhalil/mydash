"use client";

import { Copy, Eraser } from "lucide-react";
import { useCallback, useEffect, useId, useRef, useState, useSyncExternalStore } from "react";
import { Button } from "@/components/ui/core";
import { Textarea } from "@/components/ui/forms";
import { toast } from "@/components/ui/overlays";
import { readSharedClipboard, saveSharedClipboard } from "./actions";
import { CLIPBOARD_MAX, type SharedClipboard } from "./schemas";

/** Délai sans frappe avant l'enregistrement automatique. */
const SAVE_DELAY = 700;

const noopSubscribe = () => () => {};

const timeFormat = new Intl.DateTimeFormat("fr", { dateStyle: "short", timeStyle: "short" });

type Status = { kind: "saved"; at: string | null } | { kind: "saving" } | { kind: "error"; message: string };

/**
 * Un seul champ : le texte collé est enregistré dans le compte, et retrouvé
 * sur toute autre machine connectée. Au retour sur l'onglet, le texte est
 * relu (il a pu changer ailleurs), sauf modification en cours.
 */
export function SharedClipboardEditor({ initial }: { initial: SharedClipboard }) {
  const id = useId();
  // Champ bloqué jusqu'à l'hydratation : un collage trop tôt serait dupliqué.
  const hydrated = useSyncExternalStore(noopSubscribe, () => true, () => false);
  const [text, setText] = useState(initial.text);
  const [status, setStatus] = useState<Status>({ kind: "saved", at: initial.updatedAt });
  // Dernier texte connu côté serveur, et numéro de la dernière sauvegarde lancée.
  const savedText = useRef(initial.text);
  const saveRun = useRef(0);

  const save = useCallback(async (value: string) => {
    const run = ++saveRun.current;
    setStatus({ kind: "saving" });
    const result = await saveSharedClipboard(value);
    if (run !== saveRun.current) return; // une sauvegarde plus récente a pris le relais
    if (!result.ok) {
      setStatus({ kind: "error", message: result.error });
      return;
    }
    savedText.current = value;
    setStatus({ kind: "saved", at: result.data.updatedAt });
  }, []);

  useEffect(() => {
    if (text === savedText.current) return;
    const timer = setTimeout(() => void save(text), SAVE_DELAY);
    return () => clearTimeout(timer);
  }, [text, save]);

  // Retour sur l'onglet : relire le texte enregistré depuis une autre machine.
  const textRef = useRef(text);
  useEffect(() => {
    textRef.current = text;
  }, [text]);
  useEffect(() => {
    const reload = async () => {
      if (document.visibilityState !== "visible" || textRef.current !== savedText.current) return;
      const result = await readSharedClipboard();
      if (!result.ok || textRef.current !== savedText.current) return;
      savedText.current = result.data.text;
      setText(result.data.text);
      setStatus({ kind: "saved", at: result.data.updatedAt });
    };
    document.addEventListener("visibilitychange", reload);
    window.addEventListener("focus", reload);
    return () => {
      document.removeEventListener("visibilitychange", reload);
      window.removeEventListener("focus", reload);
    };
  }, []);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      toast({ title: "Copié" });
    } catch {
      toast({ title: "Copie impossible : sélectionne le texte et copie-le à la main." });
    }
  };

  const clear = () => {
    setText("");
    if (savedText.current !== "") void save("");
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <label htmlFor={id} className="text-sm font-medium text-neutral-12">
          Texte partagé
        </label>
        <div className="flex items-center gap-1">
          <Button type="button" variant="ghost" size="sm" onClick={clear} disabled={!text}>
            <Eraser className="size-4" />
            Vider
          </Button>
          <Button type="button" size="sm" onClick={copy} disabled={!text}>
            <Copy className="size-4" />
            Copier
          </Button>
        </div>
      </div>
      <Textarea
        id={id}
        value={text}
        onChange={(event) => setText(event.target.value)}
        placeholder="Colle ici un texte, puis ouvre cet outil sur une autre machine pour le copier."
        rows={12}
        disabled={!hydrated}
        maxLength={CLIPBOARD_MAX}
        spellCheck={false}
        autoComplete="off"
        className="font-mono text-sm"
      />
      <p role="status" className={status.kind === "error" ? "text-sm text-danger-11" : "text-xs text-neutral-11"}>
        {status.kind === "saving" && "Enregistrement…"}
        {status.kind === "error" && status.message}
        {status.kind === "saved" && (status.at ? `Enregistré · ${timeFormat.format(new Date(status.at))}` : "Rien d'enregistré pour l'instant.")}
      </p>
      <p className="text-xs text-neutral-11">
        Enregistré automatiquement dans ton compte. Évite d&apos;y laisser des mots de passe ou des secrets.
      </p>
    </div>
  );
}
