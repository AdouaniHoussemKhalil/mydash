"use client";

import { Archive, ArchiveRestore, Inbox, Pin, PinOff } from "lucide-react";
import { type ReactNode, useCallback, useEffect, useRef, useState, useTransition } from "react";
import { Button } from "@/components/ui/core";
import { Textarea } from "@/components/ui/forms";
import { toast } from "@/components/ui/overlays";
import { formatDateTime } from "@/lib/format";
import { cn } from "@quickadui/utils";
import { updateItem } from "../actions";
import { type Draft, draftPatch } from "../draft";
import type { Item, UpdateItemInput } from "../schemas";
import { DeleteItemButton } from "./DeleteItemButton";
import { ItemTypeBadge } from "./ItemTypeBadge";
import { LinkFields } from "./LinkFields";

const AUTOSAVE_DELAY_MS = 600;

type SaveState = "idle" | "pending" | "saving" | "saved" | "error";

const SAVE_LABELS: Record<SaveState, string> = {
  idle: "",
  pending: "Modifications en attente…",
  saving: "Enregistrement…",
  saved: "Enregistré",
  error: "Non enregistré",
};

/**
 * Édition en place : titre et contenu enregistrés automatiquement
 * (pause de frappe ou perte de focus), actions rapides à côté.
 * Monté avec key={item.id} : l'état local repart à chaque élément.
 */
export function ItemEditor({
  item,
  preview,
  relations,
}: {
  item: Item;
  /** Affiché sous le titre (ex. aperçu d'un fichier). */
  preview?: ReactNode;
  relations?: ReactNode;
}) {
  const [draft, setDraft] = useState<Draft>({ title: item.title, body: item.body });
  const [flags, setFlags] = useState({
    pinned: item.pinned,
    archived: item.archived,
    in_inbox: item.in_inbox,
  });
  // Un changement venu du serveur (ex. ranger dans un Espace sort de
  // l'Inbox) met à jour les indicateurs : resynchronisation pendant le rendu.
  const [serverFlags, setServerFlags] = useState(flags);
  if (
    item.pinned !== serverFlags.pinned ||
    item.archived !== serverFlags.archived ||
    item.in_inbox !== serverFlags.in_inbox
  ) {
    const next = { pinned: item.pinned, archived: item.archived, in_inbox: item.in_inbox };
    setServerFlags(next);
    setFlags(next);
  }
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [updatedAt, setUpdatedAt] = useState(item.updated_at);
  const [, startTransition] = useTransition();

  const saved = useRef<Draft>({ title: item.title, body: item.body });
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Dernier brouillon, lu par save() au moment où le minuteur se déclenche.
  const draftRef = useRef(draft);

  // Une seule sauvegarde à la fois ; une frappe pendant l'envoi relance après.
  const inFlight = useRef(false);
  const resave = useRef(false);
  const saveRef = useRef<() => void>(() => {});

  const save = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
    if (inFlight.current) {
      resave.current = true;
      return;
    }
    const patch = draftPatch(saved.current, draftRef.current);
    if (!patch) return;
    inFlight.current = true;
    setSaveState("saving");
    startTransition(async () => {
      const result = await updateItem(item.id, patch);
      inFlight.current = false;
      if (!result.ok) {
        resave.current = false;
        setSaveState("error");
        toast({ title: result.error, variant: "danger" });
        return;
      }
      saved.current = { ...saved.current, ...patch };
      setUpdatedAt(result.data.updated_at);
      const dirty = draftPatch(saved.current, draftRef.current) !== null;
      if (resave.current || dirty) {
        resave.current = false;
        setSaveState("pending");
        if (!timer.current) saveRef.current();
      } else {
        setSaveState("saved");
      }
    });
  }, [item.id]);

  useEffect(() => {
    saveRef.current = save;
  }, [save]);

  // Titre de la page trouvé par l'aperçu, déjà enregistré côté serveur :
  // l'afficher, sauf si le titre est en cours de modification.
  const applyServerTitle = useCallback((title: string) => {
    if (draftRef.current.title !== saved.current.title) return;
    saved.current = { ...saved.current, title };
    draftRef.current = { ...draftRef.current, title };
    setDraft(draftRef.current);
  }, []);

  const schedule = (next: Draft) => {
    draftRef.current = next;
    setDraft(next);
    setSaveState("pending");
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(save, AUTOSAVE_DELAY_MS);
  };

  // Ne rien perdre si le panneau se ferme pendant la pause de frappe,
  // et prévenir si l'onglet se ferme avant la fin de l'enregistrement.
  useEffect(() => {
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      if (inFlight.current || draftPatch(saved.current, draftRef.current)) {
        save();
        event.preventDefault();
      }
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", onBeforeUnload);
      save();
    };
  }, [save]);

  const toggle = (field: keyof typeof flags, value: boolean, message: string) => {
    const previous = flags;
    setFlags({ ...flags, [field]: value });
    startTransition(async () => {
      const result = await updateItem(item.id, { [field]: value } satisfies UpdateItemInput);
      if (result.ok) {
        setUpdatedAt(result.data.updated_at);
        toast({ title: message });
      } else {
        setFlags(previous);
        toast({ title: result.error, variant: "danger" });
      }
    });
  };

  const titleEmpty = draft.title.trim() === "";

  return (
    <article className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <ItemTypeBadge type={item.type} />
        {flags.archived && <span className="text-xs text-warning-11">Archivé</span>}
        {flags.in_inbox && <span className="text-xs text-neutral-11">Dans l&apos;Inbox</span>}
        <span role="status" aria-live="polite" className={cn("ml-auto text-xs", saveState === "error" ? "text-danger-11" : "text-neutral-11")}>
          {SAVE_LABELS[saveState]}
        </span>
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor={`title-${item.id}`} className="sr-only">
          Titre
        </label>
        <Textarea
          id={`title-${item.id}`}
          value={draft.title}
          onChange={(event) => schedule({ ...draft, title: event.target.value.replace(/\n/g, " ") })}
          onBlur={save}
          onKeyDown={(event) => {
            // Le titre tient sur une ligne : Entrée passe au contenu.
            if (event.key === "Enter") {
              event.preventDefault();
              document.getElementById(`body-${item.id}`)?.focus();
            }
          }}
          rows={1}
          maxLength={500}
          aria-invalid={titleEmpty || undefined}
          state={titleEmpty ? "error" : "default"}
          className="field-sizing-content min-h-0 resize-none border-transparent px-2 text-lg font-semibold shadow-none hover:border-neutral-6 focus:border-neutral-7"
        />
        {titleEmpty && <p className="px-2 text-xs text-danger-11">Le titre est obligatoire.</p>}
      </div>

      {preview}
      {item.type === "link" && <LinkFields item={item} onPreviewTitle={applyServerTitle} />}

      <div className="flex flex-col gap-1">
        <label htmlFor={`body-${item.id}`} className="sr-only">
          Contenu
        </label>
        <Textarea
          id={`body-${item.id}`}
          value={draft.body}
          onChange={(event) => schedule({ ...draft, body: event.target.value })}
          onBlur={save}
          placeholder={item.type === "link" ? "Tes notes sur ce lien… (Markdown)" : "Écris ici… (Markdown)"}
          className="field-sizing-content min-h-40 resize-y font-mono text-sm"
        />
      </div>

      <div className="flex flex-wrap gap-2">
        <Button
          variant="outline"
          size="sm"
          aria-pressed={flags.pinned}
          onClick={() => toggle("pinned", !flags.pinned, flags.pinned ? "Désépinglé" : "Épinglé")}
        >
          {flags.pinned ? <PinOff className="size-4" /> : <Pin className="size-4" />}
          {flags.pinned ? "Désépingler" : "Épingler"}
        </Button>
        {flags.in_inbox && (
          <Button variant="outline" size="sm" onClick={() => toggle("in_inbox", false, "Sorti de l'Inbox")}>
            <Inbox className="size-4" />
            Classer
          </Button>
        )}
        <Button
          variant="outline"
          size="sm"
          onClick={() => toggle("archived", !flags.archived, flags.archived ? "Désarchivé" : "Archivé")}
        >
          {flags.archived ? <ArchiveRestore className="size-4" /> : <Archive className="size-4" />}
          {flags.archived ? "Désarchiver" : "Archiver"}
        </Button>
      </div>

      {relations}

      <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 border-t border-neutral-6 pt-4 text-xs text-neutral-11">
        <dt>Créé</dt>
        <dd>
          <time dateTime={item.created_at}>{formatDateTime(item.created_at)}</time>
        </dd>
        <dt>Modifié</dt>
        <dd>
          <time dateTime={updatedAt}>{formatDateTime(updatedAt)}</time>
        </dd>
      </dl>

      <div className="flex justify-end">
        <DeleteItemButton id={item.id} title={draft.title.trim() || item.title} />
      </div>
    </article>
  );
}
